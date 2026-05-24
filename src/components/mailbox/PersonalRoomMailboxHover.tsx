import { isUserAtHome, presenceDotClass, presenceLabel, type UserPresence } from "../../types";

interface Props {
  ownerName: string;
  username: string;
  presence: UserPresence;
  zone: { x: number; y: number; w: number; h: number };
  onLeaveNote: () => void;
  onRingDoorbell?: () => void;
  canRing: boolean;
}

export function PersonalRoomMailboxHover({
  ownerName,
  username,
  presence,
  zone,
  onLeaveNote,
  onRingDoorbell,
  canRing,
}: Props) {
  const atHome = isUserAtHome(presence);
  const left = zone.x + zone.w + 8;
  const top = zone.y;

  return (
    <div
      className="absolute z-30 w-44 rounded-xl border-2 border-plum-300 bg-white p-3 shadow-lg"
      style={{ left: Math.min(left, 640 - 184), top }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2">
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${presenceDotClass(presence)}`} />
        <p className="text-xs font-semibold text-cozy-800">
          {atHome ? "Home" : "Away"} · {presenceLabel(presence)}
        </p>
      </div>
      <p className="mt-1 truncate text-sm font-bold text-cozy-900">{ownerName}</p>
      <p className="truncate text-[10px] text-cozy-500">@{username}</p>

      <div className="mt-3 space-y-2">
        <button type="button" className="btn-primary w-full text-xs" onClick={onLeaveNote}>
          📬 Leave a note
        </button>
        {atHome && canRing && onRingDoorbell && (
          <button type="button" className="btn-secondary w-full text-xs" onClick={onRingDoorbell}>
            🔔 Ring doorbell
          </button>
        )}
        {!atHome && (
          <p className="text-[10px] leading-snug text-cozy-500">
            Not home right now — leave a note in their mailbox.
          </p>
        )}
      </div>
    </div>
  );
}
