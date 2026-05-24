import { useEffect, useRef, useState, type RefObject } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import type { SubRoomType } from "../types";

export interface RemoteAvatar {
  id: string;
  x: number;
  y: number;
  name: string;
  subRoom: SubRoomType;
  personalOwnerId: string | null;
  inVoice: boolean;
}

interface AvatarPayload {
  userId: string;
  x: number;
  y: number;
  subRoom: SubRoomType;
  personalOwnerId: string | null;
  inVoice: boolean;
  ts: number;
}

interface Options {
  roomId: string;
  userId: string | undefined;
  posRef: RefObject<{ x: number; y: number }>;
  activeSubRoom: SubRoomType;
  activePersonalOwner?: string | null;
  inVoice: boolean;
  getDisplayName: (userId: string) => string;
  enabled: boolean;
}

const STALE_MS = 8_000;
const BROADCAST_MS = 80;
const UI_FLUSH_MS = 100;

function payloadToRemote(
  payload: AvatarPayload,
  getDisplayName: (userId: string) => string
): RemoteAvatar {
  return {
    id: payload.userId,
    x: payload.x,
    y: payload.y,
    name: getDisplayName(payload.userId),
    subRoom: payload.subRoom,
    personalOwnerId: payload.personalOwnerId,
    inVoice: payload.inVoice,
  };
}

export function useRoomAvatarPresence({
  roomId,
  userId,
  posRef,
  activeSubRoom,
  activePersonalOwner,
  inVoice,
  getDisplayName,
  enabled,
}: Options): RemoteAvatar[] {
  const [others, setOthers] = useState<RemoteAvatar[]>([]);
  const remoteRef = useRef<Map<string, AvatarPayload>>(new Map());
  const channelRef = useRef<RealtimeChannel | null>(null);

  const zoneRef = useRef({
    activeSubRoom,
    activePersonalOwner,
    inVoice,
  });
  zoneRef.current = { activeSubRoom, activePersonalOwner, inVoice };

  const getDisplayNameRef = useRef(getDisplayName);
  getDisplayNameRef.current = getDisplayName;

  useEffect(() => {
    if (!enabled || !userId || !roomId) {
      remoteRef.current.clear();
      setOthers([]);
      return;
    }

    let cancelled = false;

    const flushRemote = () => {
      if (cancelled) return;
      const now = Date.now();
      const list: RemoteAvatar[] = [];
      for (const [id, payload] of remoteRef.current) {
        if (id === userId || now - payload.ts > STALE_MS) continue;
        list.push(payloadToRemote(payload, getDisplayNameRef.current));
      }
      setOthers(list);
    };

    const mergePayload = (payload: AvatarPayload) => {
      if (payload.userId === userId) return;
      const prev = remoteRef.current.get(payload.userId);
      if (prev && payload.ts <= prev.ts) return;
      remoteRef.current.set(payload.userId, payload);
    };

    const buildSelfPayload = (): AvatarPayload => {
      const pos = posRef.current ?? { x: 500, y: 240 };
      const { activeSubRoom: subRoom, activePersonalOwner: owner, inVoice: voice } =
        zoneRef.current;
      return {
        userId,
        x: Math.round(pos.x * 10) / 10,
        y: Math.round(pos.y * 10) / 10,
        subRoom,
        personalOwnerId: subRoom === "personal" ? owner ?? null : null,
        inVoice: voice,
        ts: Date.now(),
      };
    };

    const channel = supabase.channel(`room-avatar-sync:${roomId}`, {
      config: {
        broadcast: { self: false },
        presence: { key: userId },
      },
    });

    channel
      .on("broadcast", { event: "avatar" }, ({ payload }) => {
        mergePayload(payload as AvatarPayload);
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const present = new Set(Object.keys(state));
        for (const id of remoteRef.current.keys()) {
          if (!present.has(id)) remoteRef.current.delete(id);
        }
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        if (key) remoteRef.current.delete(String(key));
      });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ online_at: Date.now() });
      }
    });

    channelRef.current = channel;

    const broadcastSelf = () => {
      if (cancelled) return;
      const payload = buildSelfPayload();
      void channel.send({
        type: "broadcast",
        event: "avatar",
        payload,
      });
    };

    broadcastSelf();

    const broadcastTimer = setInterval(broadcastSelf, BROADCAST_MS);
    const flushTimer = setInterval(flushRemote, UI_FLUSH_MS);
    const staleTimer = setInterval(() => {
      const now = Date.now();
      for (const [id, payload] of remoteRef.current) {
        if (now - payload.ts > STALE_MS) remoteRef.current.delete(id);
      }
    }, 2000);

    return () => {
      cancelled = true;
      clearInterval(broadcastTimer);
      clearInterval(flushTimer);
      clearInterval(staleTimer);
      void channel.untrack();
      void supabase.removeChannel(channel);
      channelRef.current = null;
      remoteRef.current.clear();
      setOthers([]);
    };
  }, [roomId, userId, enabled, posRef]);

  return others;
}
