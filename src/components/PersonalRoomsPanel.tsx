import { useState } from "react";
import { useApp } from "../context/AppContext";
import { AvatarPreview } from "./AvatarPreview";
import { DEFAULT_AVATAR, getDisplayAvatar } from "../types";

interface Props {
  roomId: string;
  memberIds: string[];
}

export function PersonalRoomsPanel({ roomId, memberIds }: Props) {
  const {
    user,
    users,
    personalRoomAccess,
    getRoomDisplayName,
    requestPersonalRoomAccess,
    grantPersonalRoomAccess,
    canEnterPersonalRoom,
  } = useApp();
  const [selectedOwner, setSelectedOwner] = useState<string | null>(null);

  const roomAccess = personalRoomAccess.filter((a) => a.roomId === roomId);

  return (
    <div className="max-h-[75vh] space-y-4 overflow-y-auto p-2">
      <h3 className="font-display text-lg font-semibold">Personal rooms</h3>
      <p className="text-sm text-cozy-600">
        Each member has their own space. Owners enter freely; others must request access.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {memberIds.map((memberId) => {
          const member = users.find((u) => u.id === memberId);
          const access = roomAccess.find((a) => a.ownerId === memberId);
          const isOwner = user?.id === memberId;
          const canEnter = user && canEnterPersonalRoom(roomId, memberId, user.id);
          const pending =
            user &&
            access?.pendingRequests.some((r) => r.userId === user.id);

          return (
            <div
              key={memberId}
              className={`rounded-xl border-2 p-3 ${
                selectedOwner === memberId
                  ? "border-plum-500 bg-plum-50"
                  : "border-cozy-200 bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <AvatarPreview
                  avatar={member ? getDisplayAvatar(member) : DEFAULT_AVATAR}
                  size="sm"
                />
                <div>
                  <p className="font-semibold">
                    {getRoomDisplayName(roomId, memberId)}&apos;s room
                  </p>
                  <p className="text-xs text-cozy-500">
                    {isOwner ? "Your room — you have full access" : member?.displayName}
                  </p>
                </div>
              </div>

              {isOwner && access && access.pendingRequests.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium text-plum-700">Access requests</p>
                  {access.pendingRequests.map((req) => {
                    const requester = users.find((u) => u.id === req.userId);
                    return (
                      <div
                        key={req.userId}
                        className="flex items-center justify-between rounded-lg bg-cozy-100 px-2 py-1 text-sm"
                      >
                        <span>{requester?.displayName ?? "Friend"}</span>
                        <button
                          type="button"
                          className="rounded bg-plum-600 px-2 py-0.5 text-xs text-white"
                          onClick={() =>
                            grantPersonalRoomAccess(roomId, memberId, req.userId)
                          }
                        >
                          Allow
                        </button>
                      </div>
                    );
                  })}
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
                  ) : (
                    <button
                      type="button"
                      className="btn-secondary w-full text-sm"
                      onClick={() => requestPersonalRoomAccess(roomId, memberId)}
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

      {selectedOwner && (
        <div className="card mt-2">
          <p className="font-medium">
            Inside {getRoomDisplayName(roomId, selectedOwner)}&apos;s personal room
          </p>
          <p className="mt-2 text-sm text-cozy-600">
            Private voice chat and casual 1:1 hangout space. (Demo — full WebRTC in production.)
          </p>
          <button
            type="button"
            className="btn-secondary mt-3 text-sm"
            onClick={() => setSelectedOwner(null)}
          >
            Leave room
          </button>
        </div>
      )}
    </div>
  );
}
