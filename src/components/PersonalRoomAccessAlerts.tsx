import { useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { playDoorbellSound } from "../lib/doorbellSound";
import { isPersonalRoomFull } from "../types";

interface Props {
  roomId: string;
}

function requestKey(roomId: string, ownerId: string, userId: string, requestedAt: string): string {
  return `${roomId}:${ownerId}:${userId}:${requestedAt}`;
}

export function PersonalRoomAccessAlerts({ roomId }: Props) {
  const {
    user,
    users,
    personalRoomAccess,
    getRoomDisplayName,
    grantPersonalRoomAccess,
    denyPersonalRoomAccess,
  } = useApp();

  const seenRequestsRef = useRef<Set<string>>(new Set());
  const seededRef = useRef(false);

  useEffect(() => {
    seededRef.current = false;
    seenRequestsRef.current = new Set();
  }, [roomId]);

  useEffect(() => {
    if (!user) return;

    const seedKeys = new Set<string>();
    for (const access of personalRoomAccess) {
      if (access.roomId !== roomId) continue;
      for (const req of access.pendingRequests) {
        seedKeys.add(requestKey(roomId, access.ownerId, req.userId, req.requestedAt));
      }
    }

    if (!seededRef.current) {
      seenRequestsRef.current = seedKeys;
      seededRef.current = true;
      return;
    }

    for (const key of seedKeys) {
      if (seenRequestsRef.current.has(key)) continue;
      seenRequestsRef.current.add(key);

      const access = personalRoomAccess.find(
        (a) =>
          a.roomId === roomId &&
          a.pendingRequests.some(
            (r) => requestKey(roomId, a.ownerId, r.userId, r.requestedAt) === key
          )
      );
      if (access?.ownerId === user.id) {
        playDoorbellSound();
      }
    }
  }, [personalRoomAccess, roomId, user]);

  if (!user) return null;

  const myOwnedAccess = personalRoomAccess.filter(
    (a) => a.roomId === roomId && a.ownerId === user.id && a.pendingRequests.length > 0
  );

  if (myOwnedAccess.length === 0) return null;

  const displayName = (userId: string) =>
    getRoomDisplayName(roomId, userId) ||
    users.find((u) => u.id === userId)?.displayName ||
    "Friend";

  return (
    <div className="space-y-2 border-b border-cozy-100 pb-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-plum-700">
        Personal room visits
      </p>

      {myOwnedAccess.flatMap((access) =>
        access.pendingRequests.map((req) => {
          const requesterName = displayName(req.userId);
          const full = isPersonalRoomFull(access);
          return (
            <div
              key={requestKey(roomId, access.ownerId, req.userId, req.requestedAt)}
              className="rounded-xl border-2 border-amber-300 bg-amber-50 p-3 shadow-sm"
            >
              <p className="text-sm font-semibold text-cozy-900">Someone at your door</p>
              <p className="mt-1 text-xs text-cozy-600">
                <span className="font-medium">{requesterName}</span> wants to enter your personal
                room.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-lg bg-plum-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-plum-700 disabled:opacity-50"
                  disabled={full}
                  onClick={() => {
                    const result = grantPersonalRoomAccess(roomId, access.ownerId, req.userId);
                    if (!result.ok && result.error) alert(result.error);
                  }}
                >
                  Allow
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-cozy-300 bg-white px-3 py-1.5 text-xs font-medium text-cozy-800 hover:bg-cozy-50"
                  onClick={() => denyPersonalRoomAccess(roomId, access.ownerId, req.userId)}
                >
                  Deny
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
