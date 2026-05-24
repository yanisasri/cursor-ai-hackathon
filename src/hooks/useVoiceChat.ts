import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

type SignalPayload =
  | {
      type: "offer";
      from: string;
      to: string;
      sdp: RTCSessionDescriptionInit;
    }
  | {
      type: "answer";
      from: string;
      to: string;
      sdp: RTCSessionDescriptionInit;
    }
  | {
      type: "ice";
      from: string;
      to: string;
      candidate: RTCIceCandidateInit;
    };

export interface VoiceChatState {
  isActive: boolean;
  isMuted: boolean;
  error: string | null;
  participantIds: string[];
  localStream: MediaStream | null;
  connectedPeerCount: number;
  joinVoice: () => Promise<void>;
  leaveVoice: () => void;
  toggleMute: () => void;
}

interface UseVoiceChatOptions {
  channelId: string | null;
  userId: string;
  allowedParticipantIds: string[];
}

function shouldInitiateOffer(localId: string, remoteId: string): boolean {
  return localId < remoteId;
}

export function useVoiceChat({
  channelId,
  userId,
  allowedParticipantIds,
}: UseVoiceChatOptions): VoiceChatState {
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [connectedPeerCount, setConnectedPeerCount] = useState(0);

  const allowedRef = useRef(allowedParticipantIds);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteAudioRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const pendingIceRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const isActiveRef = useRef(false);

  allowedRef.current = allowedParticipantIds;
  isActiveRef.current = isActive;

  const allowedSet = useCallback(() => new Set(allowedRef.current), []);

  const updateConnectedPeerCount = useCallback(() => {
    let count = 0;
    for (const pc of peersRef.current.values()) {
      if (pc.connectionState === "connected") count++;
    }
    setConnectedPeerCount(count);
  }, []);

  const cleanupPeer = useCallback((peerId: string) => {
    peersRef.current.get(peerId)?.close();
    peersRef.current.delete(peerId);
    pendingIceRef.current.delete(peerId);

    const audio = remoteAudioRef.current.get(peerId);
    if (audio) {
      audio.srcObject = null;
      audio.remove();
      remoteAudioRef.current.delete(peerId);
    }
    updateConnectedPeerCount();
  }, [updateConnectedPeerCount]);

  const cleanupAll = useCallback(() => {
    for (const peerId of [...peersRef.current.keys()]) {
      cleanupPeer(peerId);
    }
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setConnectedPeerCount(0);

    if (channelRef.current) {
      void channelRef.current.untrack();
      void supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setParticipantIds([]);
  }, [cleanupPeer]);

  const sendSignal = useCallback((payload: SignalPayload) => {
    channelRef.current?.send({
      type: "broadcast",
      event: "signal",
      payload,
    });
  }, []);

  const attachRemoteStream = useCallback((peerId: string, stream: MediaStream) => {
    let audio = remoteAudioRef.current.get(peerId);
    if (!audio) {
      audio = document.createElement("audio");
      audio.autoplay = true;
      audio.setAttribute("playsinline", "");
      document.body.appendChild(audio);
      remoteAudioRef.current.set(peerId, audio);
    }
    audio.srcObject = stream;
    void audio.play().catch(() => {
      /* autoplay may be blocked until user gesture */
    });
  }, []);

  const flushPendingIce = useCallback(async (peerId: string, pc: RTCPeerConnection) => {
    const queued = pendingIceRef.current.get(peerId) ?? [];
    pendingIceRef.current.delete(peerId);
    for (const candidate of queued) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }, []);

  const createPeerConnection = useCallback(
    (peerId: string) => {
      if (peersRef.current.has(peerId)) return peersRef.current.get(peerId)!;

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      peersRef.current.set(peerId, pc);

      const localStream = localStreamRef.current;
      if (localStream) {
        for (const track of localStream.getTracks()) {
          pc.addTrack(track, localStream);
        }
      }

      pc.ontrack = (event) => {
        const stream = event.streams[0];
        if (stream) attachRemoteStream(peerId, stream);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal({
            type: "ice",
            from: userId,
            to: peerId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      pc.onconnectionstatechange = () => {
        updateConnectedPeerCount();
        if (pc.connectionState === "failed" || pc.connectionState === "closed") {
          cleanupPeer(peerId);
        }
      };

      return pc;
    },
    [attachRemoteStream, cleanupPeer, sendSignal, updateConnectedPeerCount, userId]
  );

  const createAndSendOffer = useCallback(
    async (peerId: string) => {
      const pc = createPeerConnection(peerId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendSignal({ type: "offer", from: userId, to: peerId, sdp: offer });
    },
    [createPeerConnection, sendSignal, userId]
  );

  const handleSignal = useCallback(
    async (payload: SignalPayload) => {
      if (payload.to !== userId) return;
      if (!allowedSet().has(payload.from)) return;

      if (payload.type === "offer") {
        const pc = createPeerConnection(payload.from);
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        await flushPendingIce(payload.from, pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendSignal({
          type: "answer",
          from: userId,
          to: payload.from,
          sdp: answer,
        });
        return;
      }

      if (payload.type === "answer") {
        const pc = peersRef.current.get(payload.from);
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        await flushPendingIce(payload.from, pc);
        return;
      }

      if (payload.type === "ice") {
        const pc = peersRef.current.get(payload.from);
        if (!pc || !pc.remoteDescription) {
          const queue = pendingIceRef.current.get(payload.from) ?? [];
          queue.push(payload.candidate);
          pendingIceRef.current.set(payload.from, queue);
          return;
        }
        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
      }
    },
    [allowedSet, createPeerConnection, flushPendingIce, sendSignal, userId]
  );

  const syncPeersFromPresence = useCallback(
    (presentIds: string[]) => {
      const allowed = allowedSet();
      const remoteIds = presentIds.filter((id) => id !== userId && allowed.has(id));
      setParticipantIds([userId, ...remoteIds].filter((id) => allowed.has(id)));

      const remoteSet = new Set(remoteIds);
      for (const peerId of [...peersRef.current.keys()]) {
        if (!remoteSet.has(peerId)) cleanupPeer(peerId);
      }

      for (const peerId of remoteIds) {
        if (!peersRef.current.has(peerId) && shouldInitiateOffer(userId, peerId)) {
          void createAndSendOffer(peerId);
        }
      }
    },
    [allowedSet, cleanupPeer, createAndSendOffer, userId]
  );

  const subscribeToChannel = useCallback(async () => {
    if (!channelId || channelRef.current) return;

    const channel = supabase.channel(channelId, {
      config: {
        broadcast: { self: false },
        presence: { key: userId },
      },
    });

    channel
      .on("broadcast", { event: "signal" }, ({ payload }) => {
        void handleSignal(payload as SignalPayload);
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{ joined: boolean }>();
        syncPeersFromPresence(Object.keys(state));
      });

    channelRef.current = channel;

    await new Promise<void>((resolve, reject) => {
      channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ joined: true });
          resolve();
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          reject(new Error("Could not connect to voice channel."));
        }
      });
    });
  }, [channelId, handleSignal, syncPeersFromPresence, userId]);

  const joinVoice = useCallback(async () => {
    if (!channelId) {
      setError("Voice chat is not available here.");
      return;
    }
    if (!allowedSet().has(userId)) {
      setError("You do not have access to this voice chat.");
      return;
    }

    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
        video: false,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      await subscribeToChannel();
      setIsActive(true);
      setIsMuted(false);
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Microphone access was denied. Allow the mic in your browser settings."
          : err instanceof Error
            ? err.message
            : "Could not start voice chat.";
      setError(message);
      cleanupAll();
      setIsActive(false);
    }
  }, [allowedSet, channelId, cleanupAll, subscribeToChannel, userId]);

  const leaveVoice = useCallback(() => {
    setIsActive(false);
    setIsMuted(false);
    setError(null);
    cleanupAll();
  }, [cleanupAll]);

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const nextMuted = !isMuted;
    for (const track of stream.getAudioTracks()) {
      track.enabled = !nextMuted;
    }
    setIsMuted(nextMuted);
  }, [isMuted]);

  useEffect(() => {
    if (!isActiveRef.current) return;
    leaveVoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- leave when channel or access changes
  }, [channelId, allowedParticipantIds.join(",")]);

  useEffect(() => {
    return () => {
      cleanupAll();
    };
  }, [cleanupAll]);

  return {
    isActive,
    isMuted,
    error,
    participantIds,
    localStream,
    connectedPeerCount,
    joinVoice,
    leaveVoice,
    toggleMute,
  };
}
