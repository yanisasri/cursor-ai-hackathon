import { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { playDoorbellSound } from "../lib/doorbellSound";
import { isPersonalRoomOccupied } from "../types";

interface Props {
  roomId: string;
  onNewDoorbell?: () => void;
}

interface DoorbellAlert {
  key: string;
  requesterId: string;
  requestedAt: string;
}

function requestKey(
  roomId: string,
  ownerId: string,
  userId: string,
  requestedAt: string
): string {
  return `${roomId}:${ownerId}:${userId}:${requestedAt}`;
}

export function PersonalRoomAccessAlerts({ roomId, onNewDoorbell }: Props) {
  const {
    user,
    users,
    personalRoomAccess,
    getRoomDisplayName,
    grantPersonalRoomAccess,
    denyPersonalRoomAccess,
  } = useApp();

  const [alerts, setAlerts] = useState<DoorbellAlert[]>([]);
  const seenKeysRef = useRef<Set<string>>(new Set());
  const seededRef = useRef(false);

  useEffect(() => {
    seededRef.current = false;
    seenKeysRef.current = new Set();
    setAlerts([]);
  }, [roomId]);

  useEffect(() => {
    if (!user) return;

    const incoming: DoorbellAlert[] = [];
    for (const access of personalRoomAccess) {
      if (access.roomId !== roomId || access.ownerId !== user.id) continue;
      for (const req of access.pendingRequests) {
        incoming.push({
          key: requestKey(roomId, access.ownerId, req.userId, req.requestedAt),
          requesterId: req.userId,
          requestedAt: req.requestedAt,
        });
      }
    }

    if (!seededRef.current) {
      for (const alert of incoming) {
        seenKeysRef.current.add(alert.key);
      }
      seededRef.current = true;
      if (incoming.length > 0) {
        setAlerts(incoming);
      }
      return;
    }

    let addedNew = false;
    for (const alert of incoming) {
      if (seenKeysRef.current.has(alert.key)) continue;
      seenKeysRef.current.add(alert.key);
      addedNew = true;
    }

    if (addedNew) {
      playDoorbellSound();
      onNewDoorbell?.();
    }

    setAlerts((prev) => {
      const byKey = new Map(prev.map((a) => [a.key, a]));
      for (const alert of incoming) {
        if (!byKey.has(alert.key)) {
          byKey.set(alert.key, alert);
        }
      }
      return [...byKey.values()];
    });
  }, [personalRoomAccess, roomId, user, onNewDoorbell]);

  if (!user || alerts.length === 0) return null;

  const displayName = (userId: string) =>
    getRoomDisplayName(roomId, userId) ||
    users.find((u) => u.id === userId)?.displayName ||
    "Friend";

  const myAccess = personalRoomAccess.find(
    (a) => a.roomId === roomId && a.ownerId === user.id
  );
  const occupied = myAccess ? isPersonalRoomOccupied(myAccess) : false;

  const dismissAlert = (key: string) => {
    setAlerts((prev) => prev.filter((a) => a.key !== key));
  };

  return (
    <div className="sticky top-0 z-20 mb-3 space-y-2 rounded-xl border-2 border-amber-400 bg-amber-50 p-3 shadow-md">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">
        Someone at your door
      </p>

      {alerts.map((doorbell) => {
        const requesterName = displayName(doorbell.requesterId);
        return (
          <div
            key={doorbell.key}
            className="rounded-xl border border-amber-300 bg-white p-3 shadow-sm"
          >
            <p className="text-sm font-semibold text-cozy-900">{requesterName} is visiting</p>
            <p className="mt-1 text-xs text-cozy-600">
              Allow them into your personal room, or deny the visit.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg bg-plum-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-plum-700"
                onClick={() => {
                  const result = grantPersonalRoomAccess(roomId, user.id, doorbell.requesterId);
                  if (result.ok) dismissAlert(doorbell.key);
                  else if (result.error) window.alert(result.error);
                }}
              >
                Allow in
              </button>
              <button
                type="button"
                className="rounded-lg border border-cozy-300 bg-white px-3 py-1.5 text-xs font-medium text-cozy-800 hover:bg-cozy-50"
                onClick={() => {
                  denyPersonalRoomAccess(roomId, user.id, doorbell.requesterId);
                  dismissAlert(doorbell.key);
                }}
              >
                Deny
              </button>
            </div>
          </div>
        );
      })}

      {occupied && (
        <p className="text-[11px] text-amber-800">
          Someone is currently inside — they can approve you and you&apos;ll enter when they step
          out.
        </p>
      )}
    </div>
  );
}
