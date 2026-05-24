import { useApp } from "../context/AppContext";
import { isPersonalRoomFull, type UserPresence } from "../types";
import { PersonalRoomExternalMailbox } from "./mailbox/PersonalRoomExternalMailbox";

interface Props {
  roomId: string;
  ownerId: string;
  onDismiss?: () => void;
  onOpenMailboxCompose?: (ownerId: string) => void;
  onRingDoorbell?: (ownerId: string) => void;
}

export function PersonalRoomVisitPanel({
  roomId,
  ownerId,
  onDismiss,
  onOpenMailboxCompose,
  onRingDoorbell,
}: Props) {
  const {
    user,
    users,
    personalRoomAccess,
    getRoomDisplayName,
    requestPersonalRoomAccess,
    canEnterPersonalRoom,
  } = useApp();

  if (!user || ownerId === user.id) return null;

  const access = personalRoomAccess.find(
    (a) => a.roomId === roomId && a.ownerId === ownerId
  );
  const pending = access?.pendingRequests.some((r) => r.userId === user.id);
  const full = access ? isPersonalRoomFull(access) : false;
  const canEnter = canEnterPersonalRoom(roomId, ownerId, user.id);

  const ownerName =
    getRoomDisplayName(roomId, ownerId) ||
    users.find((u) => u.id === ownerId)?.displayName ||
    "Friend";
  const ownerUser = users.find((u) => u.id === ownerId);
  const username = ownerUser?.displayName ?? ownerName;
  const presence: UserPresence = ownerUser?.presence ?? "offline";

  const handleRingDoorbell = () => {
    if (onRingDoorbell) {
      onRingDoorbell(ownerId);
      return;
    }
    const result = requestPersonalRoomAccess(roomId, ownerId);
    if (!result.ok && result.error) alert(result.error);
  };

  return (
    <div className="mb-3 space-y-2 border-b border-cozy-100 pb-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-plum-700">
          Personal room visit
        </p>
        {onDismiss && (
          <button type="button" className="text-xs text-cozy-500 underline" onClick={onDismiss}>
            Dismiss
          </button>
        )}
      </div>

      {pending && (
        <div className="rounded-xl border border-cozy-200 bg-cozy-50 p-3 text-xs text-cozy-600">
          Waiting for {ownerName} to allow you in…
        </div>
      )}

      {canEnter && !pending && (
        <p className="text-xs text-cozy-600">
          You have access to {ownerName}&apos;s room. You can still leave a note in their mailbox.
        </p>
      )}

      {full && !canEnter && (
        <p className="text-xs text-amber-700">
          {ownerName}&apos;s room is full — ring doorbell is unavailable, but you can still leave a
          note.
        </p>
      )}

      <PersonalRoomExternalMailbox
        ownerName={ownerName}
        username={username}
        presence={presence}
        canRing={!canEnter && !pending && !full}
        onLeaveNote={() => onOpenMailboxCompose?.(ownerId)}
        onRingDoorbell={handleRingDoorbell}
      />
    </div>
  );
}
