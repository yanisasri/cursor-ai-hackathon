import { supabase } from "./supabaseClient";
import type {
  CalendarConnection,
  CalendarEvent,
  FriendRequest,
  NicknameRequest,
  Notification,
  PersonalRoomAccess,
  Poll,
  MailboxNote,
  RoomInvite,
  RoomMessage,
  RoomNameChangeRequest,
  RoomNickname,
  Suggestion,
  User,
  UserPresence,
  VirtualRoom,
} from "../types";
import { DEFAULT_AVATAR, SUGGESTION_CATEGORIES } from "../types";

function throwIfError(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

function inFilter(ids: string[]): string {
  return `(${ids.map((id) => `"${id}"`).join(",")})`;
}

function friendPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

function presenceFromRow(row: Record<string, unknown>): UserPresence {
  const ps = row.presence_status;
  if (ps === "online" || ps === "idle" || ps === "offline") return ps;
  return Boolean(row.is_online) ? "online" : "offline";
}

function avatarFromDbRow(row: Record<string, unknown>): User["avatar"] {
  return {
    seed: typeof row.seed === "string" ? row.seed : DEFAULT_AVATAR.seed,
    skinTone: String(row.skin_tone ?? DEFAULT_AVATAR.skinTone),
    hairColor: String(row.hair_color ?? DEFAULT_AVATAR.hairColor),
    eyesColor: String(row.eyes_color ?? DEFAULT_AVATAR.eyesColor),
    mouthColor: String(row.mouth_color ?? DEFAULT_AVATAR.mouthColor),
    hairIndex:
      typeof row.hair_index === "number" ? row.hair_index : DEFAULT_AVATAR.hairIndex,
    eyesIndex:
      typeof row.eyes_index === "number" ? row.eyes_index : DEFAULT_AVATAR.eyesIndex,
    eyebrowsIndex:
      typeof row.eyebrows_index === "number"
        ? row.eyebrows_index
        : DEFAULT_AVATAR.eyebrowsIndex,
    mouthIndex:
      typeof row.mouth_index === "number" ? row.mouth_index : DEFAULT_AVATAR.mouthIndex,
    glassesIndex:
      typeof row.glasses_index === "number"
        ? row.glasses_index
        : DEFAULT_AVATAR.glassesIndex,
    earringsIndex:
      typeof row.earrings_index === "number"
        ? row.earrings_index
        : DEFAULT_AVATAR.earringsIndex,
    freckles: typeof row.freckles === "boolean" ? row.freckles : DEFAULT_AVATAR.freckles,
  };
}

function avatarToDbRow(
  userId: string,
  avatar: User["avatar"],
  avatarCustomized: boolean
): Record<string, unknown> {
  return {
    user_id: userId,
    seed: avatar.seed ?? null,
    skin_tone: avatar.skinTone,
    hair_color: avatar.hairColor,
    eyes_color: avatar.eyesColor,
    mouth_color: avatar.mouthColor,
    hair_index: avatar.hairIndex,
    eyes_index: avatar.eyesIndex,
    eyebrows_index: avatar.eyebrowsIndex,
    mouth_index: avatar.mouthIndex,
    glasses_index: avatar.glassesIndex,
    earrings_index: avatar.earringsIndex,
    freckles: avatar.freckles,
    avatar_customized: avatarCustomized,
  };
}

export const supabaseApi = {
  async createAccount(input: {
    id: string;
    email: string;
    passwordHash: string;
    displayName: string;
    avatar: User["avatar"];
    avatarCustomized: boolean;
  }): Promise<void> {
    const { error: userError } = await supabase.from("users").insert({
      id: input.id,
      email: input.email.toLowerCase(),
      password_hash: input.passwordHash,
      display_name: input.displayName,
      is_online: true,
    });
    throwIfError(userError);

    const { error: avatarError } = await supabase
      .from("user_avatars")
      .upsert(avatarToDbRow(input.id, input.avatar, input.avatarCustomized));
    throwIfError(avatarError);
  },

  async getUserByCredentials(
    email: string,
    passwordHash: string
  ): Promise<User | null> {
    const normalized = email.trim().toLowerCase();
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("email", normalized)
      .eq("password_hash", passwordHash)
      .maybeSingle();
    throwIfError(error);
    if (!data) return null;
    const allUsers = await this.getUsers();
    return allUsers.find((u) => u.id === String(data.id)) ?? null;
  },

  async getUsers(): Promise<User[]> {
    let usersResult = await supabase
      .from("users")
      .select("id,email,password_hash,display_name,is_online,presence_status");
    if (usersResult.error?.message?.includes("presence_status")) {
      usersResult = await supabase
        .from("users")
        .select("id,email,password_hash,display_name,is_online");
    }
    const [
      { data: users, error: usersError },
      { data: avatars, error: avatarsError },
      { data: friendships, error: friendshipsError },
    ] = await Promise.all([
      Promise.resolve(usersResult),
      supabase.from("user_avatars").select("*"),
      supabase
        .from("friendships")
        .select("user_id,friend_id,status")
        .eq("status", "accepted"),
    ]);
    throwIfError(usersError);
    throwIfError(avatarsError);
    throwIfError(friendshipsError);
    const avatarMap = new Map(
      (avatars ?? []).map((a) => [
        String(a.user_id),
        {
          avatar: avatarFromDbRow(a as Record<string, unknown>),
          avatarCustomized: Boolean(a.avatar_customized),
        },
      ])
    );

    const friendMap = new Map<string, Set<string>>();
    for (const f of friendships ?? []) {
      const a = String(f.user_id);
      const b = String(f.friend_id);
      if (!friendMap.has(a)) friendMap.set(a, new Set());
      if (!friendMap.has(b)) friendMap.set(b, new Set());
      friendMap.get(a)?.add(b);
      friendMap.get(b)?.add(a);
    }

    return (users ?? []).map((u) => {
      const av = avatarMap.get(String(u.id));
      const presence = presenceFromRow(u as Record<string, unknown>);
      return {
        id: String(u.id),
        email: String(u.email),
        password: String(u.password_hash),
        displayName: String(u.display_name),
        avatar: av?.avatar ?? { ...DEFAULT_AVATAR },
        friendIds: Array.from(friendMap.get(String(u.id)) ?? []),
        online: presence !== "offline",
        presence,
        avatarCustomized: av?.avatarCustomized ?? false,
      };
    });
  },

  async setUserPresence(userId: string, presence: UserPresence): Promise<void> {
    const isOnline = presence !== "offline";
    const { error } = await supabase
      .from("users")
      .update({ is_online: isOnline, presence_status: presence })
      .eq("id", userId);
    if (error?.message?.includes("presence_status")) {
      const { error: fallbackError } = await supabase
        .from("users")
        .update({ is_online: isOnline })
        .eq("id", userId);
      throwIfError(fallbackError);
      return;
    }
    throwIfError(error);
  },

  async upsertUserAvatars(users: User[]): Promise<void> {
    if (users.length === 0) return;
    const avatarRows = users.map((u) =>
      avatarToDbRow(u.id, u.avatar, Boolean(u.avatarCustomized))
    );
    const { error } = await supabase.from("user_avatars").upsert(avatarRows);
    throwIfError(error);
  },

  async removeFriendship(userId: string, friendId: string): Promise<void> {
    const [user_id, friend_id] = friendPair(userId, friendId);
    const { error } = await supabase
      .from("friendships")
      .delete()
      .eq("user_id", user_id)
      .eq("friend_id", friend_id);
    throwIfError(error);
  },

  async getFriendRequests(): Promise<FriendRequest[]> {
    const { data, error } = await supabase
      .from("friendships")
      .select("user_id,friend_id,status,requested_by,accepted_at")
      .eq("status", "pending");
    throwIfError(error);
    return (data ?? []).map((f) => ({
      userId: String(f.user_id),
      friendId: String(f.friend_id),
      requestedBy: String(f.requested_by),
      status: "pending" as const,
      createdAt: f.accepted_at ? String(f.accepted_at) : new Date().toISOString(),
    }));
  },

  async createFriendRequest(fromUserId: string, toUserId: string): Promise<void> {
    const [user_id, friend_id] = friendPair(fromUserId, toUserId);
    const { data: existing, error: existingError } = await supabase
      .from("friendships")
      .select("status")
      .eq("user_id", user_id)
      .eq("friend_id", friend_id)
      .maybeSingle();
    throwIfError(existingError);
    if (existing?.status === "accepted") throw new Error("Already friends.");
    if (existing?.status === "pending") throw new Error("Friend request already pending.");

    const { error } = await supabase.from("friendships").upsert({
      user_id,
      friend_id,
      status: "pending",
      requested_by: fromUserId,
      accepted_at: null,
    });
    throwIfError(error);
  },

  async respondFriendRequest(
    userId: string,
    otherUserId: string,
    accept: boolean
  ): Promise<void> {
    const [user_id, friend_id] = friendPair(userId, otherUserId);
    if (accept) {
      const { error } = await supabase
        .from("friendships")
        .update({ status: "accepted", accepted_at: new Date().toISOString() })
        .eq("user_id", user_id)
        .eq("friend_id", friend_id)
        .eq("status", "pending");
      throwIfError(error);
    } else {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("user_id", user_id)
        .eq("friend_id", friend_id)
        .eq("status", "pending");
      throwIfError(error);
    }
  },

  async deleteAccount(userId: string): Promise<void> {
    const { data: ownedRooms, error: ownedRoomsError } = await supabase
      .from("rooms")
      .select("id")
      .eq("owner_id", userId);
    throwIfError(ownedRoomsError);
    const ownedRoomIds = (ownedRooms ?? []).map((r) => String(r.id));

    const deletes = [
      supabase.from("friendships").delete().or(`user_id.eq.${userId},friend_id.eq.${userId}`),
      supabase.from("user_avatars").delete().eq("user_id", userId),
      supabase.from("room_members").delete().eq("user_id", userId),
      supabase.from("room_nicknames").delete().eq("user_id", userId),
      supabase
        .from("nickname_requests")
        .delete()
        .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`),
      supabase.from("notifications").delete().eq("user_id", userId),
      supabase.from("room_messages").delete().eq("user_id", userId),
      supabase.from("room_invites").delete().or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`),
      supabase
        .from("room_name_change_approvals")
        .delete()
        .eq("user_id", userId),
      supabase
        .from("room_name_change_requests")
        .delete()
        .eq("proposed_by_user_id", userId),
      supabase.from("calendar_connections").delete().eq("user_id", userId),
      supabase.from("calendar_event_rsvps").delete().eq("user_id", userId),
      supabase.from("calendar_events").delete().eq("creator_user_id", userId),
      supabase.from("suggestion_likes").delete().eq("user_id", userId),
      supabase.from("poll_votes").delete().eq("user_id", userId),
      supabase
        .from("personal_room_access")
        .delete()
        .or(`owner_id.eq.${userId},granted_user_id.eq.${userId}`),
      supabase
        .from("personal_room_pending_requests")
        .delete()
        .or(`owner_id.eq.${userId},requester_user_id.eq.${userId}`),
    ];

    for (const query of deletes) {
      const { error } = await query;
      throwIfError(error);
    }

    if (ownedRoomIds.length > 0) {
      const { error: clearMembersError } = await supabase
        .from("room_members")
        .delete()
        .in("room_id", ownedRoomIds);
      throwIfError(clearMembersError);
      const { error: deleteRoomsError } = await supabase
        .from("rooms")
        .delete()
        .in("id", ownedRoomIds);
      throwIfError(deleteRoomsError);
    }

    const { error: deleteUserError } = await supabase.from("users").delete().eq("id", userId);
    throwIfError(deleteUserError);
  },

  async saveUsers(users: User[]): Promise<void> {
    const userRows = users.map((u) => ({
      id: u.id,
      email: u.email.toLowerCase(),
      password_hash: u.password,
      display_name: u.displayName,
      is_online: u.online,
    }));
    const pairSet = new Set<string>();
    const friendshipRows: Array<{
      user_id: string;
      friend_id: string;
      status: "accepted";
      requested_by: string;
      accepted_at: string;
    }> = [];
    for (const u of users) {
      for (const friendId of u.friendIds) {
        const [user_id, friend_id] = u.id < friendId ? [u.id, friendId] : [friendId, u.id];
        const key = `${user_id}:${friend_id}`;
        if (pairSet.has(key)) continue;
        pairSet.add(key);
        friendshipRows.push({
          user_id,
          friend_id,
          status: "accepted",
          requested_by: user_id,
          accepted_at: new Date().toISOString(),
        });
      }
    }

    const { error: usersUpsertError } = await supabase.from("users").upsert(userRows);
    throwIfError(usersUpsertError);

    const { error: friendshipsDeleteError } = await supabase
      .from("friendships")
      .delete()
      .eq("status", "accepted");
    throwIfError(friendshipsDeleteError);
    if (friendshipRows.length > 0) {
      const { error: friendshipsInsertError } = await supabase
        .from("friendships")
        .insert(friendshipRows);
      throwIfError(friendshipsInsertError);
    }
  },

  async getRooms(): Promise<VirtualRoom[]> {
    const { data: rooms, error: roomsError } = await supabase
      .from("rooms")
      .select("id,name,area,owner_id,max_members,created_at");
    throwIfError(roomsError);
    if (!rooms || rooms.length === 0) return [];

    const roomIds = rooms.map((r) => String(r.id));
    const { data: members, error: membersError } = await supabase
      .from("room_members")
      .select("room_id,user_id")
      .in("room_id", roomIds);
    throwIfError(membersError);

    const memberMap = new Map<string, string[]>();
    for (const m of members ?? []) {
      const roomId = String(m.room_id);
      const list = memberMap.get(roomId) ?? [];
      list.push(String(m.user_id));
      memberMap.set(roomId, list);
    }

    return (rooms ?? []).map((r) => ({
      // Include owner as a safe fallback member so owner's rooms still appear
      // even if room_members rows are missing/partially hidden by policies.
      id: String(r.id),
      name: String(r.name),
      area: r.area as VirtualRoom["area"],
      maxMembers: Number(r.max_members),
      memberIds: Array.from(
        new Set([...(memberMap.get(String(r.id)) ?? []), String(r.owner_id)])
      ),
      ownerId: String(r.owner_id),
      createdAt: String(r.created_at),
    }));
  },

  async saveRooms(rooms: VirtualRoom[]): Promise<void> {
    const roomRows = rooms.map((r) => ({
      id: r.id,
      name: r.name,
      area: r.area,
      owner_id: r.ownerId,
      max_members: r.maxMembers,
      created_at: r.createdAt,
    }));
    const membershipRows = rooms.flatMap((r) =>
      r.memberIds.map((userId) => ({ room_id: r.id, user_id: userId }))
    );

    const { error: roomsUpsertError } = await supabase.from("rooms").upsert(roomRows);
    throwIfError(roomsUpsertError);

    const roomIds = rooms.map((r) => r.id);
    if (roomIds.length > 0) {
      const { error: clearMembersError } = await supabase
        .from("room_members")
        .delete()
        .in("room_id", roomIds);
      throwIfError(clearMembersError);
    }
    if (membershipRows.length > 0) {
      const { error: insertMembersError } = await supabase
        .from("room_members")
        .insert(membershipRows);
      throwIfError(insertMembersError);
    }
  },

  async createRoom(room: VirtualRoom): Promise<void> {
    const { error: roomError } = await supabase.from("rooms").insert({
      id: room.id,
      name: room.name,
      area: room.area,
      owner_id: room.ownerId,
      max_members: room.maxMembers,
      created_at: room.createdAt,
    });
    throwIfError(roomError);

    const membershipRows = room.memberIds.map((userId) => ({
      room_id: room.id,
      user_id: userId,
    }));
    if (membershipRows.length > 0) {
      const { error: membersError } = await supabase
        .from("room_members")
        .insert(membershipRows);
      throwIfError(membersError);
    }
  },

  async deleteRoom(roomId: string): Promise<void> {
    const { data: polls, error: pollsError } = await supabase
      .from("polls")
      .select("id")
      .eq("room_id", roomId);
    throwIfError(pollsError);
    const pollIds = (polls ?? []).map((p) => String(p.id));
    if (pollIds.length > 0) {
      const { error: votesError } = await supabase
        .from("poll_votes")
        .delete()
        .in("poll_id", pollIds);
      throwIfError(votesError);
      const { error: optionsError } = await supabase
        .from("poll_options")
        .delete()
        .in("poll_id", pollIds);
      throwIfError(optionsError);
      const { error: pollsDeleteError } = await supabase.from("polls").delete().in("id", pollIds);
      throwIfError(pollsDeleteError);
    }

    const { data: suggestions, error: suggestionsError } = await supabase
      .from("suggestions")
      .select("id")
      .eq("room_id", roomId);
    throwIfError(suggestionsError);
    const suggestionIds = (suggestions ?? []).map((s) => String(s.id));
    if (suggestionIds.length > 0) {
      const { error: likesError } = await supabase
        .from("suggestion_likes")
        .delete()
        .in("suggestion_id", suggestionIds);
      throwIfError(likesError);
      const { error: suggestionsDeleteError } = await supabase
        .from("suggestions")
        .delete()
        .in("id", suggestionIds);
      throwIfError(suggestionsDeleteError);
    }

    const roomScopedDeletes = [
      supabase.from("room_messages").delete().eq("room_id", roomId),
      supabase.from("room_nicknames").delete().eq("room_id", roomId),
      supabase.from("nickname_requests").delete().eq("room_id", roomId),
      supabase.from("calendar_events").delete().eq("room_id", roomId),
      supabase.from("personal_room_access").delete().eq("room_id", roomId),
      supabase.from("personal_room_pending_requests").delete().eq("room_id", roomId),
      supabase.from("suggestion_categories").delete().eq("room_id", roomId),
      supabase.from("room_invites").delete().eq("room_id", roomId),
      supabase.from("room_name_change_requests").delete().eq("room_id", roomId),
      supabase.from("room_members").delete().eq("room_id", roomId),
    ];
    for (const query of roomScopedDeletes) {
      const { error } = await query;
      throwIfError(error);
    }

    const { error: roomDeleteError } = await supabase.from("rooms").delete().eq("id", roomId);
    throwIfError(roomDeleteError);
  },

  async leaveRoom(roomId: string, userId: string): Promise<void> {
    const room = (await this.getRooms()).find((r) => r.id === roomId);
    if (!room) throw new Error("Room not found.");
    if (!room.memberIds.includes(userId)) throw new Error("You are not in this room.");

    const nextMemberIds = room.memberIds.filter((id) => id !== userId);
    if (nextMemberIds.length <= 1) {
      await this.deleteRoom(roomId);
      return;
    }

    const { error: memberError } = await supabase
      .from("room_members")
      .delete()
      .eq("room_id", roomId)
      .eq("user_id", userId);
    throwIfError(memberError);

    if (room.ownerId === userId) {
      const { error: ownerError } = await supabase
        .from("rooms")
        .update({ owner_id: nextMemberIds[0] })
        .eq("id", roomId);
      throwIfError(ownerError);
    }
  },

  async getCalendarEvents(): Promise<CalendarEvent[]> {
    const [
      { data: events, error: eventsError },
      { data: rsvps, error: rsvpsError },
      { data: connections, error: connectionsError },
    ] = await Promise.all([
      supabase
        .from("calendar_events")
        .select("id,room_id,creator_user_id,title,location,start_at,end_at,source,status"),
      supabase.from("calendar_event_rsvps").select("event_id,user_id,response"),
      supabase
        .from("calendar_connections")
        .select("user_id,google_connected,apple_connected"),
    ]);
    throwIfError(eventsError);
    throwIfError(rsvpsError);
    throwIfError(connectionsError);

    const joinedByEvent = new Map<string, string[]>();
    for (const r of rsvps ?? []) {
      if (r.response !== "yes") continue;
      const eventId = String(r.event_id);
      const list = joinedByEvent.get(eventId) ?? [];
      list.push(String(r.user_id));
      joinedByEvent.set(eventId, list);
    }

    const connByUser = new Map<string, { google: boolean; apple: boolean }>();
    for (const c of connections ?? []) {
      connByUser.set(String(c.user_id), {
        google: Boolean(c.google_connected),
        apple: Boolean(c.apple_connected),
      });
    }

    return (events ?? []).map((e) => {
      const joined = joinedByEvent.get(String(e.id)) ?? [];
      return {
        id: String(e.id),
        roomId: e.room_id ? String(e.room_id) : "",
        userId: String(e.creator_user_id),
        title: String(e.title),
        location: e.location ? String(e.location) : "",
        startAt: String(e.start_at),
        endAt: String(e.end_at),
        source: e.source as CalendarEvent["source"],
        status: e.status as CalendarEvent["status"],
        rsvpUserIds: joined,
        syncedToGoogleUserIds: joined.filter((id) => connByUser.get(id)?.google),
        syncedToAppleUserIds: joined.filter((id) => connByUser.get(id)?.apple),
      };
    });
  },

  async saveCalendarEvents(events: CalendarEvent[]): Promise<void> {
    const rows = events.map((e) => ({
      id: e.id,
      room_id: e.roomId || null,
      creator_user_id: e.userId,
      title: e.title,
      location: e.location || null,
      start_at: e.startAt,
      end_at: e.endAt,
      source: e.source,
      status: e.status ?? "confirmed",
    }));
    const rsvpRows = events.flatMap((e) =>
      (e.rsvpUserIds ?? []).map((userId) => ({
        event_id: e.id,
        user_id: userId,
        response: "yes",
      }))
    );

    const { error: upsertError } = await supabase.from("calendar_events").upsert(rows);
    throwIfError(upsertError);
    if (events.length > 0) {
      const { error: clearRsvpsError } = await supabase
        .from("calendar_event_rsvps")
        .delete()
        .in("event_id", events.map((e) => e.id));
      throwIfError(clearRsvpsError);
    }
    if (rsvpRows.length > 0) {
      const { error: insertRsvpsError } = await supabase
        .from("calendar_event_rsvps")
        .insert(rsvpRows);
      throwIfError(insertRsvpsError);
    }
  },

  async getCalendarConnections(): Promise<CalendarConnection[]> {
    const { data, error } = await supabase
      .from("calendar_connections")
      .select("user_id,google_connected,apple_connected");
    throwIfError(error);
    return (data ?? []).map((c) => ({
      userId: String(c.user_id),
      googleConnected: Boolean(c.google_connected),
      appleConnected: Boolean(c.apple_connected),
    }));
  },

  async saveCalendarConnections(connections: CalendarConnection[]): Promise<void> {
    const rows = connections.map((c) => ({
      user_id: c.userId,
      google_connected: c.googleConnected,
      apple_connected: c.appleConnected,
      google_connected_at: c.googleConnected ? new Date().toISOString() : null,
      apple_connected_at: c.appleConnected ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from("calendar_connections").upsert(rows);
    throwIfError(error);
  },

  async getSuggestionCategoriesByRoom(): Promise<Record<string, string[]>> {
    const { data, error } = await supabase
      .from("suggestion_categories")
      .select("room_id,label")
      .not("room_id", "is", null);
    throwIfError(error);
    const builtInCategoryIds = new Set(SUGGESTION_CATEGORIES.map((c) => c.id));
    const out: Record<string, Set<string>> = {};
    for (const row of data ?? []) {
      const roomId = String(row.room_id);
      const normalized = String(row.label).trim().toLowerCase();
      if (!normalized || builtInCategoryIds.has(normalized)) continue;
      if (!out[roomId]) out[roomId] = new Set<string>();
      out[roomId].add(normalized);
    }
    return Object.fromEntries(
      Object.entries(out).map(([roomId, labels]) => [roomId, Array.from(labels)])
    );
  },

  async saveSuggestionCategoriesByRoom(categoriesByRoom: Record<string, string[]>): Promise<void> {
    const rows = Object.entries(categoriesByRoom).flatMap(([roomId, labels]) =>
      labels.map((label) => ({
        room_id: roomId,
        label: label.toLowerCase(),
      }))
    );
    if (rows.length === 0) return;
    const { error } = await supabase
      .from("suggestion_categories")
      .upsert(rows, { onConflict: "room_id,label" });
    throwIfError(error);
  },

  async getSuggestions(): Promise<Suggestion[]> {
    const [
      { data: suggestions, error: suggestionsError },
      { data: likes, error: likesError },
      { data: categories, error: categoriesError },
    ] = await Promise.all([
      supabase
        .from("suggestions")
        .select("id,room_id,title,details,link,image_url,category_id,author_user_id,archived,created_at"),
      supabase.from("suggestion_likes").select("suggestion_id,user_id"),
      supabase.from("suggestion_categories").select("id,label"),
    ]);
    throwIfError(suggestionsError);
    throwIfError(likesError);
    throwIfError(categoriesError);

    const likeMap = new Map<string, string[]>();
    for (const l of likes ?? []) {
      const suggestionId = String(l.suggestion_id);
      const list = likeMap.get(suggestionId) ?? [];
      list.push(String(l.user_id));
      likeMap.set(suggestionId, list);
    }
    const categoryMap = new Map((categories ?? []).map((c) => [String(c.id), String(c.label)]));

    return (suggestions ?? []).map((s) => ({
      id: String(s.id),
      roomId: String(s.room_id),
      title: String(s.title) + (s.details ? ` — ${String(s.details)}` : ""),
      category: (categoryMap.get(String(s.category_id)) ?? "other").toLowerCase(),
      addedBy: String(s.author_user_id),
      likes: likeMap.get(String(s.id)) ?? [],
      link: s.link ? String(s.link) : undefined,
      imageUrl: s.image_url ? String(s.image_url) : undefined,
      createdAt: String(s.created_at),
      archived: Boolean(s.archived),
    }));
  },

  async saveSuggestions(suggestions: Suggestion[]): Promise<void> {
    const categoriesByRoom = new Map<string, Set<string>>();
    for (const s of suggestions) {
      const set = categoriesByRoom.get(s.roomId) ?? new Set<string>();
      set.add(s.category.toLowerCase());
      categoriesByRoom.set(s.roomId, set);
    }

    const categoryRows = Array.from(categoriesByRoom.entries()).flatMap(([roomId, labels]) =>
      Array.from(labels).map((label) => ({ room_id: roomId, label }))
    );
    if (categoryRows.length > 0) {
      const { error: categoriesUpsertError } = await supabase
        .from("suggestion_categories")
        .upsert(categoryRows, { onConflict: "room_id,label" });
      throwIfError(categoriesUpsertError);
    }

    const { data: categories, error: categoriesError } = await supabase
      .from("suggestion_categories")
      .select("id,room_id,label");
    throwIfError(categoriesError);
    const categoryId = new Map<string, string>();
    for (const c of categories ?? []) {
      categoryId.set(`${String(c.room_id)}:${String(c.label).toLowerCase()}`, String(c.id));
    }

    const suggestionRows = suggestions.map((s) => {
      const [title, ...details] = s.title.split(" — ");
      return {
        id: s.id,
        room_id: s.roomId,
        title,
        details: details.length > 0 ? details.join(" — ") : null,
        link: s.link ?? null,
        image_url: s.imageUrl ?? null,
        category_id: categoryId.get(`${s.roomId}:${s.category.toLowerCase()}`) ?? null,
        author_user_id: s.addedBy,
        archived: Boolean(s.archived),
        created_at: s.createdAt,
      };
    });
    const likeRows = suggestions.flatMap((s) =>
      s.likes.map((userId) => ({
        suggestion_id: s.id,
        user_id: userId,
      }))
    );

    const { error: upsertSuggestionsError } = await supabase
      .from("suggestions")
      .upsert(suggestionRows);
    throwIfError(upsertSuggestionsError);

    const ids = suggestions.map((s) => s.id);
    if (ids.length > 0) {
      const { error: clearLikesError } = await supabase
        .from("suggestion_likes")
        .delete()
        .in("suggestion_id", ids);
      throwIfError(clearLikesError);
    }
    if (likeRows.length > 0) {
      const { error: insertLikesError } = await supabase
        .from("suggestion_likes")
        .insert(likeRows);
      throwIfError(insertLikesError);
    }
    if (ids.length > 0) {
      const { error: deleteMissingError } = await supabase
        .from("suggestions")
        .delete()
        .not("id", "in", inFilter(ids));
      throwIfError(deleteMissingError);
    }
  },

  async getPolls(): Promise<Poll[]> {
    const [
      { data: polls, error: pollsError },
      { data: options, error: optionsError },
      { data: votes, error: votesError },
    ] = await Promise.all([
      supabase.from("polls").select("id,room_id,question,created_by"),
      supabase.from("poll_options").select("id,poll_id,text"),
      supabase.from("poll_votes").select("poll_id,option_id,user_id"),
    ]);
    throwIfError(pollsError);
    throwIfError(optionsError);
    throwIfError(votesError);

    const votesByOption = new Map<string, string[]>();
    for (const v of votes ?? []) {
      const optionId = String(v.option_id);
      const list = votesByOption.get(optionId) ?? [];
      list.push(String(v.user_id));
      votesByOption.set(optionId, list);
    }
    const optionsByPoll = new Map<string, Poll["options"]>();
    for (const o of options ?? []) {
      const pollId = String(o.poll_id);
      const list = optionsByPoll.get(pollId) ?? [];
      list.push({
        id: String(o.id),
        text: String(o.text),
        votes: votesByOption.get(String(o.id)) ?? [],
      });
      optionsByPoll.set(pollId, list);
    }

    return (polls ?? []).map((p) => ({
      id: String(p.id),
      roomId: String(p.room_id),
      question: String(p.question),
      options: optionsByPoll.get(String(p.id)) ?? [],
      createdBy: String(p.created_by),
    }));
  },

  async savePolls(polls: Poll[]): Promise<void> {
    const ids = polls.map((p) => p.id);
    const pollRows = polls.map((p) => ({
      id: p.id,
      room_id: p.roomId,
      question: p.question,
      created_by: p.createdBy,
    }));
    const optionRows = polls.flatMap((p) =>
      p.options.map((o) => ({
        id: o.id,
        poll_id: p.id,
        text: o.text,
      }))
    );
    const voteRows = polls.flatMap((p) =>
      p.options.flatMap((o) =>
        o.votes.map((userId) => ({
          poll_id: p.id,
          option_id: o.id,
          user_id: userId,
        }))
      )
    );

    if (ids.length === 0) {
      const { data: existing, error: existingError } = await supabase.from("polls").select("id");
      throwIfError(existingError);
      const existingIds = (existing ?? []).map((r) => String(r.id));
      if (existingIds.length > 0) {
        const { error } = await supabase.from("polls").delete().in("id", existingIds);
        throwIfError(error);
      }
      return;
    }

    const { error: cleanupError } = await supabase
      .from("polls")
      .delete()
      .not("id", "in", inFilter(ids));
    throwIfError(cleanupError);
    const { error: upsertPollsError } = await supabase.from("polls").upsert(pollRows);
    throwIfError(upsertPollsError);
    const { error: clearOptionsError } = await supabase
      .from("poll_options")
      .delete()
      .in("poll_id", ids);
    throwIfError(clearOptionsError);
    if (optionRows.length > 0) {
      const { error: insertOptionsError } = await supabase.from("poll_options").insert(optionRows);
      throwIfError(insertOptionsError);
    }
    const { error: clearVotesError } = await supabase
      .from("poll_votes")
      .delete()
      .in("poll_id", ids);
    throwIfError(clearVotesError);
    if (voteRows.length > 0) {
      const { error: insertVotesError } = await supabase.from("poll_votes").insert(voteRows);
      throwIfError(insertVotesError);
    }
  },

  async getNotifications(): Promise<Notification[]> {
    const { data, error } = await supabase
      .from("notifications")
      .select("id,user_id,type,title,message,read,created_at")
      .order("created_at", { ascending: false });
    throwIfError(error);
    return (data ?? []).map((n) => ({
      id: String(n.id),
      userId: String(n.user_id),
      type: n.type as Notification["type"],
      title: String(n.title),
      message: String(n.message),
      read: Boolean(n.read),
      createdAt: String(n.created_at),
    }));
  },

  async saveNotifications(notifications: Notification[]): Promise<void> {
    const rows = notifications.map((n) => ({
      id: n.id,
      user_id: n.userId,
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      created_at: n.createdAt,
    }));
    const { error: upsertError } = await supabase.from("notifications").upsert(rows);
    throwIfError(upsertError);
    const ids = notifications.map((n) => n.id);
    if (ids.length > 0) {
      const { error: cleanupError } = await supabase
        .from("notifications")
        .delete()
        .not("id", "in", inFilter(ids));
      throwIfError(cleanupError);
    }
  },

  async getMessages(): Promise<RoomMessage[]> {
    const { data, error } = await supabase
      .from("room_messages")
      .select("id,room_id,user_id,text,created_at")
      .order("created_at", { ascending: true });
    throwIfError(error);
    return (data ?? []).map((m) => ({
      id: String(m.id),
      roomId: String(m.room_id),
      userId: String(m.user_id),
      text: String(m.text),
      createdAt: String(m.created_at),
    }));
  },

  async saveMessages(messages: RoomMessage[]): Promise<void> {
    const rows = messages.map((m) => ({
      id: m.id,
      room_id: m.roomId,
      user_id: m.userId,
      text: m.text,
      created_at: m.createdAt,
    }));
    const { error: upsertError } = await supabase.from("room_messages").upsert(rows);
    throwIfError(upsertError);
    const ids = messages.map((m) => m.id);
    if (ids.length > 0) {
      const { error: cleanupError } = await supabase
        .from("room_messages")
        .delete()
        .not("id", "in", inFilter(ids));
      throwIfError(cleanupError);
    }
  },

  async getRoomNicknames(): Promise<RoomNickname[]> {
    const { data, error } = await supabase.from("room_nicknames").select("room_id,user_id,nickname");
    throwIfError(error);
    return (data ?? []).map((n) => ({
      roomId: String(n.room_id),
      userId: String(n.user_id),
      nickname: String(n.nickname),
    }));
  },

  async saveRoomNicknames(nicknames: RoomNickname[]): Promise<void> {
    const rows = nicknames.map((n) => ({
      room_id: n.roomId,
      user_id: n.userId,
      nickname: n.nickname,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from("room_nicknames").upsert(rows);
    throwIfError(error);
  },

  async getNicknameRequests(): Promise<NicknameRequest[]> {
    const { data, error } = await supabase
      .from("nickname_requests")
      .select("id,room_id,from_user_id,to_user_id,suggested_nickname,status");
    throwIfError(error);
    return (data ?? []).map((n) => ({
      id: String(n.id),
      roomId: String(n.room_id),
      fromUserId: String(n.from_user_id),
      toUserId: String(n.to_user_id),
      suggestedNickname: String(n.suggested_nickname),
      status: n.status as NicknameRequest["status"],
    }));
  },

  async saveNicknameRequests(requests: NicknameRequest[]): Promise<void> {
    const rows = requests.map((r) => ({
      id: r.id,
      room_id: r.roomId,
      from_user_id: r.fromUserId,
      to_user_id: r.toUserId,
      suggested_nickname: r.suggestedNickname,
      status: r.status,
      responded_at: r.status === "pending" ? null : new Date().toISOString(),
    }));
    const { error } = await supabase.from("nickname_requests").upsert(rows);
    throwIfError(error);
  },

  async getPersonalRoomAccess(): Promise<PersonalRoomAccess[]> {
    const [
      { data: accessRows, error: accessError },
      { data: pendingRows, error: pendingError },
    ] = await Promise.all([
      supabase.from("personal_room_access").select("room_id,owner_id,granted_user_id"),
      supabase
        .from("personal_room_pending_requests")
        .select("room_id,owner_id,requester_user_id,requested_at"),
    ]);
    throwIfError(accessError);
    throwIfError(pendingError);

    const map = new Map<string, PersonalRoomAccess>();
    const key = (roomId: string, ownerId: string) => `${roomId}:${ownerId}`;

    for (const a of accessRows ?? []) {
      const roomId = String(a.room_id);
      const ownerId = String(a.owner_id);
      const k = key(roomId, ownerId);
      if (!map.has(k)) {
        map.set(k, { roomId, ownerId, grantedIds: [], activeGuestId: null, pendingRequests: [] });
      }
      map.get(k)?.grantedIds.push(String(a.granted_user_id));
    }
    for (const p of pendingRows ?? []) {
      const roomId = String(p.room_id);
      const ownerId = String(p.owner_id);
      const k = key(roomId, ownerId);
      if (!map.has(k)) {
        map.set(k, {
          roomId,
          ownerId,
          grantedIds: [ownerId],
          activeGuestId: null,
          pendingRequests: [],
        });
      }
      map.get(k)?.pendingRequests.push({
        userId: String(p.requester_user_id),
        requestedAt: String(p.requested_at),
      });
    }

    for (const entry of map.values()) {
      if (!entry.grantedIds.includes(entry.ownerId)) {
        entry.grantedIds.push(entry.ownerId);
      }
    }

    try {
      const { data: activeRows, error: activeError } = await supabase
        .from("personal_room_active_guest")
        .select("room_id,owner_id,guest_user_id");
      if (!activeError) {
        for (const row of activeRows ?? []) {
          const roomId = String(row.room_id);
          const ownerId = String(row.owner_id);
          const k = key(roomId, ownerId);
          const entry = map.get(k);
          if (entry) {
            entry.activeGuestId = row.guest_user_id ? String(row.guest_user_id) : null;
          }
        }
      }
    } catch {
      /* table may not exist yet */
    }

    return Array.from(map.values());
  },

  async setPersonalRoomActiveGuest(
    roomId: string,
    ownerId: string,
    guestUserId: string | null
  ): Promise<void> {
    const { error: deleteError } = await supabase
      .from("personal_room_active_guest")
      .delete()
      .eq("room_id", roomId)
      .eq("owner_id", ownerId);
    throwIfError(deleteError);

    if (guestUserId) {
      const { error: insertError } = await supabase.from("personal_room_active_guest").insert({
        room_id: roomId,
        owner_id: ownerId,
        guest_user_id: guestUserId,
      });
      throwIfError(insertError);
    }
  },

  async savePersonalRoomAccess(access: PersonalRoomAccess[]): Promise<void> {
    const roomIds = Array.from(new Set(access.map((a) => a.roomId)));
    if (roomIds.length > 0) {
      const { error: clearAccessError } = await supabase
        .from("personal_room_access")
        .delete()
        .in("room_id", roomIds);
      throwIfError(clearAccessError);
      const { error: clearPendingError } = await supabase
        .from("personal_room_pending_requests")
        .delete()
        .in("room_id", roomIds);
      throwIfError(clearPendingError);
    }

    const accessRows = access.flatMap((a) =>
      a.grantedIds.map((userId) => ({
        room_id: a.roomId,
        owner_id: a.ownerId,
        granted_user_id: userId,
      }))
    );
    const pendingRows = access.flatMap((a) =>
      a.pendingRequests.map((p) => ({
        room_id: a.roomId,
        owner_id: a.ownerId,
        requester_user_id: p.userId,
        requested_at: p.requestedAt,
      }))
    );
    if (accessRows.length > 0) {
      const { error: insertAccessError } = await supabase
        .from("personal_room_access")
        .insert(accessRows);
      throwIfError(insertAccessError);
    }
    if (pendingRows.length > 0) {
      const { error: insertPendingError } = await supabase
        .from("personal_room_pending_requests")
        .insert(pendingRows);
      throwIfError(insertPendingError);
    }
  },

  async upsertPersonalRoomPendingRequest(
    roomId: string,
    ownerId: string,
    requesterUserId: string,
    requestedAt: string
  ): Promise<void> {
    const { error: deleteError } = await supabase
      .from("personal_room_pending_requests")
      .delete()
      .eq("room_id", roomId)
      .eq("owner_id", ownerId)
      .eq("requester_user_id", requesterUserId);
    throwIfError(deleteError);

    const { error: insertError } = await supabase.from("personal_room_pending_requests").insert({
      room_id: roomId,
      owner_id: ownerId,
      requester_user_id: requesterUserId,
      requested_at: requestedAt,
    });
    throwIfError(insertError);
  },

  async deletePersonalRoomPendingRequest(
    roomId: string,
    ownerId: string,
    requesterUserId: string
  ): Promise<void> {
    const { error } = await supabase
      .from("personal_room_pending_requests")
      .delete()
      .eq("room_id", roomId)
      .eq("owner_id", ownerId)
      .eq("requester_user_id", requesterUserId);
    throwIfError(error);
  },

  async insertPersonalRoomGranted(
    roomId: string,
    ownerId: string,
    grantedUserId: string
  ): Promise<void> {
    const { data: existing, error: existingError } = await supabase
      .from("personal_room_access")
      .select("granted_user_id")
      .eq("room_id", roomId)
      .eq("owner_id", ownerId)
      .eq("granted_user_id", grantedUserId)
      .maybeSingle();
    throwIfError(existingError);
    if (existing) return;

    const { error } = await supabase.from("personal_room_access").insert({
      room_id: roomId,
      owner_id: ownerId,
      granted_user_id: grantedUserId,
    });
    throwIfError(error);
  },

  async removePersonalRoomGranted(
    roomId: string,
    ownerId: string,
    grantedUserId: string
  ): Promise<void> {
    const { error } = await supabase
      .from("personal_room_access")
      .delete()
      .eq("room_id", roomId)
      .eq("owner_id", ownerId)
      .eq("granted_user_id", grantedUserId);
    throwIfError(error);
  },

  async getRoomInvites(): Promise<RoomInvite[]> {
    const { data, error } = await supabase
      .from("room_invites")
      .select("id,room_id,from_user_id,to_user_id,status,created_at")
      .order("created_at", { ascending: false });
    throwIfError(error);
    return (data ?? []).map((i) => ({
      id: String(i.id),
      roomId: String(i.room_id),
      fromUserId: String(i.from_user_id),
      toUserId: String(i.to_user_id),
      status: i.status as RoomInvite["status"],
      createdAt: String(i.created_at),
    }));
  },

  async createRoomInvite(roomId: string, fromUserId: string, toUserId: string): Promise<void> {
    const room = (await this.getRooms()).find((r) => r.id === roomId);
    if (!room) throw new Error("Room not found.");
    if (!room.memberIds.includes(fromUserId)) throw new Error("You are not in this room.");
    if (room.memberIds.includes(toUserId)) throw new Error("They are already in this room.");
    if (room.memberIds.length >= room.maxMembers) throw new Error("Room is full.");

    const { data: existing, error: existingError } = await supabase
      .from("room_invites")
      .select("id")
      .eq("room_id", roomId)
      .eq("to_user_id", toUserId)
      .eq("status", "pending")
      .maybeSingle();
    throwIfError(existingError);
    if (existing) throw new Error("Invite already sent.");

    const { error } = await supabase.from("room_invites").insert({
      room_id: roomId,
      from_user_id: fromUserId,
      to_user_id: toUserId,
      status: "pending",
    });
    throwIfError(error);
  },

  async respondRoomInvite(inviteId: string, userId: string, accept: boolean): Promise<void> {
    const { data: invite, error: inviteError } = await supabase
      .from("room_invites")
      .select("id,room_id,from_user_id,to_user_id,status")
      .eq("id", inviteId)
      .maybeSingle();
    throwIfError(inviteError);
    if (!invite) throw new Error("Invite not found.");
    if (String(invite.to_user_id) !== userId) throw new Error("Not your invite.");
    if (invite.status !== "pending") throw new Error("Invite already handled.");

    if (accept) {
      const room = (await this.getRooms()).find((r) => r.id === String(invite.room_id));
      if (!room) throw new Error("Room no longer exists.");
      if (room.memberIds.length >= room.maxMembers) throw new Error("Room is full.");
      const { error: memberError } = await supabase.from("room_members").insert({
        room_id: invite.room_id,
        user_id: userId,
      });
      throwIfError(memberError);
    }

    const { error: updateError } = await supabase
      .from("room_invites")
      .update({ status: accept ? "accepted" : "declined" })
      .eq("id", inviteId);
    throwIfError(updateError);
  },

  async getRoomNameChangeRequests(): Promise<RoomNameChangeRequest[]> {
    const { data: requests, error: requestsError } = await supabase
      .from("room_name_change_requests")
      .select("id,room_id,proposed_name,proposed_by_user_id,status,created_at")
      .eq("status", "pending");
    throwIfError(requestsError);
    if (!requests || requests.length === 0) return [];

    const requestIds = requests.map((r) => String(r.id));
    const { data: approvals, error: approvalsError } = await supabase
      .from("room_name_change_approvals")
      .select("request_id,user_id,decision")
      .in("request_id", requestIds);
    throwIfError(approvalsError);

    return requests.map((r) => {
      const id = String(r.id);
      const memberApprovals: Record<string, "pending" | "approved" | "declined"> = {};
      for (const a of approvals ?? []) {
        if (String(a.request_id) !== id) continue;
        memberApprovals[String(a.user_id)] = a.decision as "pending" | "approved" | "declined";
      }
      return {
        id,
        roomId: String(r.room_id),
        proposedName: String(r.proposed_name),
        proposedByUserId: String(r.proposed_by_user_id),
        status: r.status as RoomNameChangeRequest["status"],
        memberApprovals,
        createdAt: String(r.created_at),
      };
    });
  },

  async proposeRoomNameChange(
    roomId: string,
    proposedByUserId: string,
    proposedName: string
  ): Promise<string> {
    const room = (await this.getRooms()).find((r) => r.id === roomId);
    if (!room) throw new Error("Room not found.");
    if (!room.memberIds.includes(proposedByUserId)) throw new Error("You are not in this room.");
    const trimmed = proposedName.trim();
    if (!trimmed) throw new Error("Enter a room name.");
    if (trimmed === room.name) throw new Error("That is already the room name.");

    const { data: existing, error: existingError } = await supabase
      .from("room_name_change_requests")
      .select("id")
      .eq("room_id", roomId)
      .eq("status", "pending")
      .maybeSingle();
    throwIfError(existingError);
    if (existing) throw new Error("A name change is already pending approval.");

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const { error: insertError } = await supabase.from("room_name_change_requests").insert({
      id,
      room_id: roomId,
      proposed_name: trimmed,
      proposed_by_user_id: proposedByUserId,
      status: "pending",
      created_at: now,
    });
    throwIfError(insertError);

    const approvalRows = room.memberIds.map((memberId) => ({
      request_id: id,
      user_id: memberId,
      decision: memberId === proposedByUserId ? "approved" : "pending",
      decided_at: memberId === proposedByUserId ? now : null,
    }));
    const { error: approvalsError } = await supabase
      .from("room_name_change_approvals")
      .insert(approvalRows);
    throwIfError(approvalsError);
    return id;
  },

  async respondRoomNameChange(
    requestId: string,
    userId: string,
    approve: boolean
  ): Promise<{ applied: boolean; roomId: string }> {
    const { data: request, error: requestError } = await supabase
      .from("room_name_change_requests")
      .select("id,room_id,proposed_name,status")
      .eq("id", requestId)
      .maybeSingle();
    throwIfError(requestError);
    if (!request || request.status !== "pending") throw new Error("Request not found.");

    const roomId = String(request.room_id);
    const room = (await this.getRooms()).find((r) => r.id === roomId);
    if (!room || !room.memberIds.includes(userId)) throw new Error("You are not in this room.");

    const now = new Date().toISOString();
    const decision = approve ? "approved" : "declined";
    const { error: approvalError } = await supabase
      .from("room_name_change_approvals")
      .update({ decision, decided_at: now })
      .eq("request_id", requestId)
      .eq("user_id", userId);
    throwIfError(approvalError);

    const { data: approvals, error: approvalsError } = await supabase
      .from("room_name_change_approvals")
      .select("user_id,decision")
      .eq("request_id", requestId);
    throwIfError(approvalsError);

    const decisionMap = new Map<string, string>();
    for (const a of approvals ?? []) {
      decisionMap.set(String(a.user_id), String(a.decision));
    }

    if (room.memberIds.some((m) => decisionMap.get(m) === "declined")) {
      const { error: declineError } = await supabase
        .from("room_name_change_requests")
        .update({ status: "declined" })
        .eq("id", requestId);
      throwIfError(declineError);
      return { applied: false, roomId };
    }

    const allApproved = room.memberIds.every((m) => decisionMap.get(m) === "approved");
    if (!allApproved) return { applied: false, roomId };

    const { error: roomError } = await supabase
      .from("rooms")
      .update({ name: String(request.proposed_name) })
      .eq("id", roomId);
    throwIfError(roomError);

    const { error: completeError } = await supabase
      .from("room_name_change_requests")
      .update({ status: "approved" })
      .eq("id", requestId);
    throwIfError(completeError);
    return { applied: true, roomId };
  },

  async getMailboxNotes(): Promise<MailboxNote[]> {
    const { data, error } = await supabase
      .from("personal_room_mailbox_notes")
      .select(
        "id,room_id,owner_id,from_user_id,body,paper_color,envelope_color,stickers,read,in_reply_to_id,created_at"
      )
      .order("created_at", { ascending: false });
    throwIfError(error);
    return (data ?? []).map((n) => ({
      id: String(n.id),
      roomId: String(n.room_id),
      ownerId: String(n.owner_id),
      fromUserId: String(n.from_user_id),
      body: String(n.body),
      paperColor: String(n.paper_color),
      envelopeColor: String(n.envelope_color),
      stickers: Array.isArray(n.stickers) ? n.stickers.map(String) : [],
      read: Boolean(n.read),
      inReplyToId: n.in_reply_to_id ? String(n.in_reply_to_id) : null,
      createdAt: String(n.created_at),
    }));
  },

  async insertMailboxNote(note: MailboxNote): Promise<void> {
    const { error } = await supabase.from("personal_room_mailbox_notes").insert({
      id: note.id,
      room_id: note.roomId,
      owner_id: note.ownerId,
      from_user_id: note.fromUserId,
      body: note.body,
      paper_color: note.paperColor,
      envelope_color: note.envelopeColor,
      stickers: note.stickers,
      read: note.read,
      in_reply_to_id: note.inReplyToId ?? null,
      created_at: note.createdAt,
    });
    throwIfError(error);
  },

  async markMailboxNoteRead(noteId: string): Promise<void> {
    const { error } = await supabase
      .from("personal_room_mailbox_notes")
      .update({ read: true })
      .eq("id", noteId);
    throwIfError(error);
  },
};
