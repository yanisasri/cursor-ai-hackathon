import { useMicLevel } from "../hooks/useMicLevel";
import type { VoiceChatState } from "../hooks/useVoiceChat";
import { MicLevelIndicator } from "./MicLevelIndicator";

interface Props {
  title: string;
  description: string;
  participantNames: Record<string, string>;
  voice: VoiceChatState;
  compact?: boolean;
  unavailableMessage?: string;
}

export function VoiceChatPanel({
  title,
  description,
  participantNames,
  voice,
  compact = false,
  unavailableMessage,
}: Props) {
  const {
    isActive,
    isMuted,
    error,
    participantIds,
    localStream,
    connectedPeerCount,
    joinVoice,
    leaveVoice,
    toggleMute,
  } = voice;

  const { level, isSpeaking } = useMicLevel(localStream, isMuted);

  if (unavailableMessage) {
    return (
      <div className={compact ? "mt-2" : "p-4"}>
        {!compact && <h3 className="font-semibold">{title}</h3>}
        <p className={`text-sm text-cozy-500 ${compact ? "" : "mt-2"}`}>{unavailableMessage}</p>
      </div>
    );
  }

  const uniqueParticipants = Array.from(new Set(participantIds));
  const othersInChannel = Math.max(0, uniqueParticipants.length - (isActive ? 1 : 0));

  return (
    <div className={compact ? "mt-2 w-full rounded-lg border border-cozy-200 bg-white p-3" : "p-4"}>
      {!compact && (
        <>
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-cozy-600">{description}</p>
        </>
      )}

      {compact && <p className="mb-2 text-xs font-medium text-plum-700">{title}</p>}

      <div className={`flex flex-wrap gap-2 ${compact ? "" : "mt-4"}`}>
        {!isActive ? (
          <button type="button" className="btn-primary text-sm" onClick={() => void joinVoice()}>
            Join voice
          </button>
        ) : (
          <>
            <button
              type="button"
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
                isMuted ? "bg-amber-500 text-white" : "bg-green-600 text-white"
              }`}
              onClick={toggleMute}
              aria-pressed={isMuted}
            >
              {isMuted ? (
                <>
                  <MicMutedIcon />
                  Unmute
                </>
              ) : (
                <>
                  <MicOnIcon />
                  Mute
                </>
              )}
            </button>
            <button type="button" className="btn-secondary text-sm" onClick={leaveVoice}>
              Leave voice
            </button>
          </>
        )}
      </div>

      {isActive && (
        <MicLevelIndicator
          level={level}
          isSpeaking={isSpeaking}
          isMuted={isMuted}
          isActive={isActive}
          compact={compact}
        />
      )}

      {!isActive && (
        <p className={`text-xs text-cozy-500 ${compact ? "mt-2" : "mt-3"}`}>
          Join voice to see the mic level meter while you talk.
        </p>
      )}

      {error && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {isActive && (
        <div className="mt-3 space-y-2">
          <div className="rounded-lg border border-cozy-200 bg-white px-3 py-2 text-xs text-cozy-600">
            <p>
              <span className="font-medium text-cozy-800">Connection:</span>{" "}
              {connectedPeerCount > 0
                ? `Linked to ${connectedPeerCount} other ${connectedPeerCount === 1 ? "person" : "people"}`
                : othersInChannel > 0
                  ? `${othersInChannel} in channel — connecting…`
                  : "Waiting for someone else to join voice"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-cozy-500">
              In voice ({uniqueParticipants.length})
            </p>
            <ul className="mt-1 space-y-1">
              {uniqueParticipants.map((id) => (
                <li key={id} className="flex items-center gap-2 text-sm text-cozy-800">
                  <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                  {participantNames[id] ?? "Member"}
                </li>
              ))}
              {uniqueParticipants.length === 1 && (
                <li className="text-xs text-cozy-500">
                  Open a second browser window to test two-way audio.
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function MicOnIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    </svg>
  );
}

function MicMutedIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <line x1="4" y1="4" x2="20" y2="20" />
    </svg>
  );
}
