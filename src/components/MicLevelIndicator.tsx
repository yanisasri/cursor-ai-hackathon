interface Props {
  level: number;
  isSpeaking: boolean;
  isMuted: boolean;
  isActive: boolean;
  compact?: boolean;
}

function MicIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-5 w-5 shrink-0 ${muted ? "text-amber-600" : "text-plum-700"}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
      {muted && <line x1="4" y1="4" x2="20" y2="20" className="text-amber-600" />}
    </svg>
  );
}

const BAR_COUNT = 12;

export function MicLevelIndicator({ level, isSpeaking, isMuted, isActive, compact }: Props) {
  if (!isActive) return null;

  const fillRatio = isMuted ? 0 : Math.min(1, level * 8);
  const activeBars = Math.round(fillRatio * BAR_COUNT);

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border border-plum-200 bg-plum-50 px-3 py-2.5 ${
        compact ? "mt-2" : "mt-3"
      }`}
      aria-live="polite"
      aria-label={
        isMuted
          ? "Microphone muted"
          : isSpeaking
            ? "Microphone picking up speech"
            : "Microphone active, no speech detected"
      }
    >
      <MicIcon muted={isMuted} />

      <div className="min-w-0 flex-1">
        <div className="flex items-end gap-1" style={{ height: compact ? 28 : 32 }}>
          {Array.from({ length: BAR_COUNT }, (_, i) => {
            const lit = !isMuted && i < activeBars;
            const speaking = lit && isSpeaking;
            return (
              <span
                key={i}
                className={`w-2 flex-1 rounded-sm transition-all duration-75 ${
                  isMuted
                    ? "bg-cozy-300"
                    : speaking
                      ? "bg-green-500 shadow-sm shadow-green-300"
                      : lit
                        ? "bg-plum-500"
                        : "bg-cozy-200"
                }`}
                style={{
                  height: `${Math.max(20, ((i + 1) / BAR_COUNT) * 100)}%`,
                }}
              />
            );
          })}
        </div>
        <p className={`mt-1.5 font-medium ${isSpeaking && !isMuted ? "text-green-700" : "text-cozy-600"} text-xs`}>
          {isMuted
            ? "Muted — unmute to send audio"
            : isSpeaking
              ? "Speaking detected"
              : "Say something to test your mic"}
        </p>
      </div>
    </div>
  );
}
