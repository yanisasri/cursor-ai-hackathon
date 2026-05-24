import type { PersonalRoomAccess } from "../types";

export function personalRoomAccessKey(a: { roomId: string; ownerId: string }): string {
  return `${a.roomId}:${a.ownerId}`;
}

/** Keep in-flight doorbell requests when a poll returns stale data. */
export function mergePersonalRoomAccessLists(
  fetched: PersonalRoomAccess[],
  prev: PersonalRoomAccess[]
): PersonalRoomAccess[] {
  const prevMap = new Map(prev.map((a) => [personalRoomAccessKey(a), a]));
  const resultMap = new Map(fetched.map((a) => [personalRoomAccessKey(a), { ...a }]));

  for (const [key, prevEntry] of prevMap) {
    const fetchedEntry = resultMap.get(key);
    if (!fetchedEntry) {
      resultMap.set(key, prevEntry);
      continue;
    }

    const pendingByUser = new Map<string, { userId: string; requestedAt: string }>();
    for (const req of fetchedEntry.pendingRequests) {
      pendingByUser.set(req.userId, req);
    }
    for (const req of prevEntry.pendingRequests) {
      if (!pendingByUser.has(req.userId)) {
        pendingByUser.set(req.userId, req);
      }
    }
    for (const userId of fetchedEntry.grantedIds) {
      if (!prevEntry.grantedIds.includes(userId)) {
        pendingByUser.delete(userId);
      }
    }

    resultMap.set(key, {
      ...fetchedEntry,
      grantedIds: [...new Set([fetchedEntry.ownerId, ...fetchedEntry.grantedIds])],
      activeGuestId: fetchedEntry.activeGuestId ?? prevEntry.activeGuestId ?? null,
      pendingRequests: [...pendingByUser.values()],
    });
  }

  return Array.from(resultMap.values());
}
