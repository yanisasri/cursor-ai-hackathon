import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { playDoorbellSound } from "../lib/doorbellSound";
import type { VoiceChatState } from "../hooks/useVoiceChat";
import {
  getPersonalRoomGuests,
  isApprovedPersonalGuest,
  isPersonalRoomOccupied,
  isUserAtHome,
  isWaitingForPersonalRoomTurn,
  PERSONAL_ROOM_MAX_OCCUPANCY,
  presenceDotClass,
  presenceLabel,
} from "../types";
import { VoiceChatPanel } from "./VoiceChatPanel";
import { PersonalRoomExternalMailbox } from "./mailbox/PersonalRoomExternalMailbox";
import { MailboxInboxPanel } from "./mailbox/MailboxInboxPanel";

interface VoiceContextProps {
  channelId: string;
  allowedParticipantIds: string[];
  title: string;
  description: string;
  unavailableMessage?: string;
}

interface Props {
  roomId: string;
  memberIds: string[];
  selectedOwnerId?: string | null;
  onSelectOwner?: (ownerId: string | null) => void;
  voiceContext?: VoiceContextProps | null;
  voice?: VoiceChatState;
  participantNames?: Record<string, string>;
  onOpenMailboxCompose?: (ownerId: string) => void;
  onRingDoorbell?: (ownerId: string) => void;
}

export function PersonalRoomsPanel({
  roomId,
  memberIds,
  selectedOwnerId: selectedOwnerProp,
  onSelectOwner,
  voiceContext,
  voice,
  participantNames = {},
  onOpenMailboxCompose,
  onRingDoorbell,
}: Props) {
  const {
    user,
    users,
    personalRoomAccess,
    getRoomDisplayName,
    requestPersonalRoomAccess,
    grantPersonalRoomAccess,
    leavePersonalRoom,
    denyPersonalRoomAccess,
    canEnterPersonalRoom,
    enterPersonalRoomAsGuest,
  } = useApp();
  const [selectedOwnerLocal, setSelectedOwnerLocal] = useState<string | null>(null);
  const selectedOwner = selectedOwnerProp ?? selectedOwnerLocal;

  const setSelectedOwner = (ownerId: string | null) => {
    onSelectOwner?.(ownerId);
    if (selectedOwnerProp === undefined) setSelectedOwnerLocal(ownerId);
  };

  useEffect(() => {
    if (selectedOwnerProp) setSelectedOwnerLocal(selectedOwnerProp);
  }, [selectedOwnerProp]);

  const roomAccess = personalRoomAccess.filter((a) => a.roomId === roomId);

  return (
    <div className="max-h-[75vh] space-y-4 overflow-y-auto p-2">
      <h3 className="font-display text-lg font-semibold">Personal rooms</h3>
      <p className="text-sm text-cozy-600">
        Each member has a private room on the map below. Owner + 1 guest max (
        {PERSONAL_ROOM_MAX_OCCUPANCY} people). Walk to a room or pick one here — request access
        to enter a friend&apos;s space.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {memberIds.map((memberId) => {
          const access = roomAccess.find((a) => a.ownerId === memberId);
          const isOwner = user?.id === memberId;
          const canEnter = user && canEnterPersonalRoom(roomId, memberId, user.id);
          const approved = user && access && isApprovedPersonalGuest(access, user.id);
          const waiting =
            user && access && isWaitingForPersonalRoomTurn(access, user.id);
          const pending =
            user && access?.pendingRequests.some((r) => r.userId === user.id);
          const occupied = access ? isPersonalRoomOccupied(access) : false;
          const guests = access ? getPersonalRoomGuests(access) : [];
          const guestName =
            guests.length > 0
              ? getRoomDisplayName(roomId, guests[0]) ||
                users.find((u) => u.id === guests[0])?.displayName
              : null;
          const displayName = getRoomDisplayName(roomId, memberId);
          const username = users.find((u) => u.id === memberId)?.displayName ?? "Friend";
          const memberUser = users.find((u) => u.id === memberId);
          const memberAtHome = memberUser ? isUserAtHome(memberUser.presence) : false;

          return (
            <div
              key={memberId}
              className={`rounded-xl border-2 p-3 ${
                selectedOwner === memberId
                  ? "border-plum-500 bg-plum-50"
                  : "border-cozy-200 bg-white"
              }`}
            >
              <div>
                <p className="font-semibold text-cozy-900">{displayName}</p>
                <p className="text-xs text-cozy-500">@{username}</p>
                <p className="mt-1 text-xs text-cozy-600">
                  {isOwner
                    ? "Your room — you always have access"
                    : canEnter
                      ? "Inside or tap to enter"
                      : waiting
                        ? "Approved — wait your turn"
                        : approved
                          ? "Approved — walk in when free"
                          : pending
                            ? "Request pending"
                            : occupied
                              ? "Guest inside — ring or wait"
                              : memberAtHome
                                ? "Home — ring doorbell to visit"
                                : "Away — leave a note in their mailbox"}
                </p>
                {!isOwner && memberUser && (
                  <p className="mt-1 flex items-center gap-1 text-[10px] text-cozy-500">
                    <span
                      className={`inline-block h-1.5 w-1.5 rounded-full ${presenceDotClass(memberUser.presence)}`}
                    />
                    {memberAtHome ? "Home" : "Away"} · {presenceLabel(memberUser.presence)}
                  </p>
                )}
                {access && (
                  <p className="mt-0.5 text-[10px] text-cozy-400">
                    {guests.length}/{PERSONAL_ROOM_MAX_OCCUPANCY - 1} guest
                    {guestName ? ` · with ${guestName}` : ""}
                  </p>
                )}
              </div>

              {isOwner && access && access.pendingRequests.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium text-plum-700">Access requests</p>
                  {access.pendingRequests.map((req) => {
                    const requester = users.find((u) => u.id === req.userId);
                    const requesterName =
                      getRoomDisplayName(roomId, req.userId) ||
                      requester?.displayName ||
                      "Friend";
                    return (
                      <div
                        key={req.userId}
                        className="flex items-center justify-between rounded-lg bg-cozy-100 px-2 py-1 text-sm"
                      >
                        <span>{requesterName}</span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            className="rounded bg-plum-600 px-2 py-0.5 text-xs text-white"
                            onClick={() => {
                              const result = grantPersonalRoomAccess(
                                roomId,
                                memberId,
                                req.userId
                              );
                              if (!result.ok) alert(result.error);
                            }}
                          >
                            Allow
                          </button>
                          <button
                            type="button"
                            className="rounded border border-cozy-300 bg-white px-2 py-0.5 text-xs text-cozy-800"
                            onClick={() => denyPersonalRoomAccess(roomId, memberId, req.userId)}
                          >
                            Deny
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {occupied && (
                    <p className="text-[10px] text-amber-700">
                      A guest is inside — new visitors can be approved and will wait their turn.
                    </p>
                  )}
                </div>
              )}

              {!isOwner && user && (
                <div className="mt-3">
                  {canEnter ? (
                    <button
                      type="button"
                      className="btn-primary w-full text-sm"
                      onClick={() => {
                        const result = enterPersonalRoomAsGuest(roomId, memberId);
                        if (result.ok) setSelectedOwner(memberId);
                        else if (result.error) alert(result.error);
                      }}
                    >
                      Enter room
                    </button>
                  ) : waiting ? (
                    <p className="text-center text-sm text-amber-700">
                      Approved — someone is inside. Wait your turn.
                    </p>
                  ) : pending ? (
                    <p className="text-center text-sm text-cozy-500">Request pending…</p>
                  ) : approved ? (
                    <button
                      type="button"
                      className="btn-primary w-full text-sm"
                      onClick={() => {
                        const result = enterPersonalRoomAsGuest(roomId, memberId);
                        if (result.ok) setSelectedOwner(memberId);
                        else if (result.error) alert(result.error);
                      }}
                    >
                      Enter room
                    </button>
                  ) : memberAtHome ? (
                    <button
                      type="button"
                      className="btn-secondary w-full text-sm"
                      onClick={() => {
                        const result = requestPersonalRoomAccess(roomId, memberId);
                        if (result.ok) playDoorbellSound();
                        else if (result.error) alert(result.error);
                      }}
                    >
                      Ring doorbell
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-secondary w-full text-sm"
                      onClick={() => onOpenMailboxCompose?.(memberId)}
                    >
                      Leave a note
                    </button>
                  )}
                </div>
              )}

              {isOwner && selectedOwner !== memberId && (
                <button
                  type="button"
                  className="btn-primary mt-3 w-full text-sm"
                  onClick={() => setSelectedOwner(memberId)}
                >
                  Enter your room
                </button>
              )}
            </div>
          );
        })}
      </div>

      {selectedOwner && user && (
        <div className="card mt-2">
          <p className="font-medium">
            {selectedOwner === user.id
              ? "Your personal room"
              : `Visiting ${getRoomDisplayName(roomId, selectedOwner)}'s room`}
          </p>
          <p className="mt-1 text-xs text-cozy-500">
            @{users.find((u) => u.id === selectedOwner)?.displayName ?? "Friend"}
          </p>

          {selectedOwner === user.id ? (
            <>
              <p className="mt-2 text-sm text-cozy-600">
                Private 1:1 voice chat — max {PERSONAL_ROOM_MAX_OCCUPANCY} people (owner + one
                guest).
              </p>
              <MailboxInboxPanel roomId={roomId} ownerId={user.id} />
            </>
          ) : (
            (() => {
              const host = users.find((u) => u.id === selectedOwner);
              if (!host) return null;
              const access = personalRoomAccess.find(
                (a) => a.roomId === roomId && a.ownerId === selectedOwner
              );
              const canEnter = canEnterPersonalRoom(roomId, selectedOwner, user.id);
              const approved = access && isApprovedPersonalGuest(access, user.id);
              const waiting = access && isWaitingForPersonalRoomTurn(access, user.id);
              const pending = access?.pendingRequests.some((r) => r.userId === user.id);
              return (
                <>
                  {waiting && (
                    <p className="mt-2 text-sm text-amber-700">
                      You&apos;re approved but someone else is visiting. Wait your turn — no need to
                      ring again.
                    </p>
                  )}
                  {approved && canEnter && (
                    <p className="mt-2 text-sm text-cozy-600">
                      You&apos;re inside (or can re-enter freely until you go offline or visit
                      another personal room).
                    </p>
                  )}
                  {!canEnter && !pending && !approved && (
                    <div className="mt-3">
                      <PersonalRoomExternalMailbox
                        ownerName={getRoomDisplayName(roomId, selectedOwner)}
                        username={host.displayName}
                        presence={host.presence}
                        canRing
                        compact
                        onLeaveNote={() => onOpenMailboxCompose?.(selectedOwner)}
                        onRingDoorbell={() => onRingDoorbell?.(selectedOwner)}
                      />
                    </div>
                  )}
                  {approved && !canEnter && !waiting && (
                    <p className="mt-2 text-sm text-cozy-600">
                      You have approval — enter when the room is free.
                    </p>
                  )}
                </>
              );
            })()
          )}
          {voice && voiceContext && canEnterPersonalRoom(roomId, selectedOwner, user.id) && (
            <VoiceChatPanel
              title={voiceContext.title}
              description={voiceContext.description}
              participantNames={participantNames}
              voice={voice}
              compact
            />
          )}
          <button
            type="button"
            className="btn-secondary mt-3 text-sm"
            onClick={() => {
              if (user.id !== selectedOwner) {
                leavePersonalRoom(roomId, selectedOwner);
              }
              setSelectedOwner(null);
            }}
          >
            {selectedOwner === user.id ? "Leave room" : "Step out (keep access)"}
          </button>
        </div>
      )}
    </div>
  );
}
