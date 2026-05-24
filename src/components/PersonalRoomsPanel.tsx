import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import type { VoiceChatState } from "../hooks/useVoiceChat";
import {
  getPersonalRoomGuests,
  isPersonalRoomFull,
  PERSONAL_ROOM_MAX_OCCUPANCY,
} from "../types";
import { VoiceChatPanel } from "./VoiceChatPanel";

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
}

export function PersonalRoomsPanel({
  roomId,
  memberIds,
  selectedOwnerId: selectedOwnerProp,
  onSelectOwner,
  voiceContext,
  voice,
  participantNames = {},
}: Props) {
  const {
    user,
    users,
    personalRoomAccess,
    getRoomDisplayName,
    requestPersonalRoomAccess,
    grantPersonalRoomAccess,
    leavePersonalRoom,
    canEnterPersonalRoom,
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
          const pending =
            user && access?.pendingRequests.some((r) => r.userId === user.id);
          const full = access ? isPersonalRoomFull(access) : false;
          const guests = access ? getPersonalRoomGuests(access) : [];
          const guestName =
            guests.length > 0
              ? getRoomDisplayName(roomId, guests[0]) ||
                users.find((u) => u.id === guests[0])?.displayName
              : null;
          const displayName = getRoomDisplayName(roomId, memberId);
          const username = users.find((u) => u.id === memberId)?.displayName ?? "Friend";

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
                      ? "You can enter"
                      : pending
                        ? "Request pending"
                        : full
                          ? "Room full (owner + guest)"
                          : "Request access to enter"}
                </p>
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
                        <button
                          type="button"
                          className="rounded bg-plum-600 px-2 py-0.5 text-xs text-white disabled:opacity-50"
                          disabled={full && !guests.includes(req.userId)}
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
                      </div>
                    );
                  })}
                  {full && (
                    <p className="text-[10px] text-amber-700">
                      Room is full — guest must leave before allowing someone new.
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
                      onClick={() => setSelectedOwner(memberId)}
                    >
                      Enter room
                    </button>
                  ) : pending ? (
                    <p className="text-center text-sm text-cozy-500">Request pending…</p>
                  ) : full ? (
                    <p className="text-center text-sm text-cozy-500">Room is full</p>
                  ) : (
                    <button
                      type="button"
                      className="btn-secondary w-full text-sm"
                      onClick={() => {
                        const result = requestPersonalRoomAccess(roomId, memberId);
                        if (!result.ok && result.error) alert(result.error);
                      }}
                    >
                      Request to enter
                    </button>
                  )}
                </div>
              )}

              {isOwner && (
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
            Inside {getRoomDisplayName(roomId, selectedOwner)}&apos;s personal room
          </p>
          <p className="mt-1 text-xs text-cozy-500">
            @{users.find((u) => u.id === selectedOwner)?.displayName ?? "Friend"}
          </p>
          <p className="mt-2 text-sm text-cozy-600">
            Private 1:1 voice chat space — max {PERSONAL_ROOM_MAX_OCCUPANCY} people (owner + one
            guest).
          </p>
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
            Leave room
          </button>
        </div>
      )}
    </div>
  );
}
