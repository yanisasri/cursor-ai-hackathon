import {
  isUserAtHome,
  presenceDotClass,
  presenceLabel,
  type UserPresence,
} from "../../types";

interface Props {
  ownerName: string;
  username: string;
  presence: UserPresence;
  canRing: boolean;
  onLeaveNote: () => void;
  onRingDoorbell?: () => void;
  compact?: boolean;
}

export function PersonalRoomExternalMailbox({
  ownerName,
  username,
  presence,
  canRing,
  onLeaveNote,
  onRingDoorbell,
  compact = false,
}: Props) {
  const atHome = isUserAtHome(presence);

  return (
    <div
      className={`rounded-xl border-2 border-sky-300 bg-gradient-to-b from-sky-50 to-white ${
        compact ? "p-3" : "p-4"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="relative shrink-0" aria-hidden>
          <div className="h-14 w-16">
            <div className="absolute bottom-0 left-1/2 h-10 w-12 -translate-x-1/2 rounded-md bg-sky-500 shadow-inner" />
            <div className="absolute bottom-8 left-1/2 h-2 w-8 -translate-x-1/2 rounded-sm bg-sky-800" />
            <div
              className={`absolute bottom-9 right-1 h-3 w-5 rounded-sm bg-red-500 ${
                atHome ? "" : "opacity-60"
              }`}
            />
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-xl">📬</div>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-700">
            {ownerName}&apos;s mailbox
          </p>
          <p className="truncate text-xs text-cozy-500">@{username}</p>
          <div className="mt-1 flex items-center gap-1.5">
            <span
              className={`inline-block h-2 w-2 rounded-full ${presenceDotClass(presence)}`}
            />
            <span className="text-[11px] text-cozy-600">
              {atHome ? "Home — can ring doorbell" : "Away — leave a note here"}
            </span>
          </div>
        </div>
      </div>

      <div className={`flex flex-wrap gap-2 ${compact ? "mt-3" : "mt-4"}`}>
        <button type="button" className="btn-primary text-xs" onClick={onLeaveNote}>
          Leave a note
        </button>
        {atHome && canRing && onRingDoorbell && (
          <button type="button" className="btn-secondary text-xs" onClick={onRingDoorbell}>
            Ring doorbell
          </button>
        )}
      </div>

      {!atHome && (
        <p className="mt-2 text-[11px] text-cozy-500">
          They aren&apos;t home right now. Notes go to their mailbox until they return.
        </p>
      )}
    </div>
  );
}
