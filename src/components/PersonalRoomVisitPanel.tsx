import { useApp } from "../context/AppContext";
import {
  isApprovedPersonalGuest,
  isPersonalRoomOccupied,
  isWaitingForPersonalRoomTurn,
  type UserPresence,
} from "../types";
import { PersonalRoomExternalMailbox } from "./mailbox/PersonalRoomExternalMailbox";

interface Props {
  roomId: string;
  ownerId: string;
  onDismiss?: () => void;
  onOpenMailboxCompose?: (ownerId: string) => void;
  onRingDoorbell?: (ownerId: string) => void;
  onEnterRoom?: (ownerId: string) => void;
}

export function PersonalRoomVisitPanel({
  roomId,
  ownerId,
  onDismiss,
  onOpenMailboxCompose,
  onRingDoorbell,
  onEnterRoom,
}: Props) {
  const {
    user,
    users,
    personalRoomAccess,
    getRoomDisplayName,
    requestPersonalRoomAccess,
    canEnterPersonalRoom,
    enterPersonalRoomAsGuest,
  } = useApp();

  if (!user || ownerId === user.id) return null;

  const access = personalRoomAccess.find(
    (a) => a.roomId === roomId && a.ownerId === ownerId
  );
  const pending = access?.pendingRequests.some((r) => r.userId === user.id);
  const approved = access ? isApprovedPersonalGuest(access, user.id) : false;
  const waiting = access ? isWaitingForPersonalRoomTurn(access, user.id) : false;
  const occupied = access ? isPersonalRoomOccupied(access) : false;
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

  const handleEnter = () => {
    const result = enterPersonalRoomAsGuest(roomId, ownerId);
    if (result.ok) onEnterRoom?.(ownerId);
    else if (result.error) alert(result.error);
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

      {approved && waiting && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          You&apos;re approved to visit {ownerName}, but someone else is inside. Wait your turn —
          you won&apos;t need to ring again once they leave.
        </div>
      )}

      {approved && canEnter && !pending && (
        <div className="space-y-2">
          <p className="text-xs text-cozy-600">
            You&apos;re approved — walk in or tap enter. You can come and go until you go offline or
            visit someone else&apos;s personal room.
          </p>
          <button type="button" className="btn-primary w-full text-xs" onClick={handleEnter}>
            Enter room
          </button>
        </div>
      )}

      {occupied && !approved && !pending && (
        <p className="text-xs text-cozy-500">
          Someone is visiting {ownerName} right now. You can still ring the doorbell or leave a
          note.
        </p>
      )}

      {!approved && !pending && (
        <PersonalRoomExternalMailbox
          ownerName={ownerName}
          username={username}
          presence={presence}
          canRing
          onLeaveNote={() => onOpenMailboxCompose?.(ownerId)}
          onRingDoorbell={handleRingDoorbell}
        />
      )}

      {approved && !canEnter && !waiting && (
        <p className="text-xs text-cozy-600">
          You have access to {ownerName}&apos;s room. You can still leave a note in their mailbox.
        </p>
      )}
    </div>
  );
}
