import { supabase } from "./supabaseClient";
import type {
  CalendarConnection,
  CalendarEvent,
  NicknameRequest,
  Notification,
  PersonalRoomAccess,
  Poll,
  RoomMessage,
  RoomNickname,
  Suggestion,
  User,
  VirtualRoom,
} from "../types";
import { DEFAULT_AVATAR } from "../types";

function throwIfError(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

function inFilter(ids: string[]): string {
  return `(${ids.map((id) => `"${id}"`).join(",")})`;
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

    const { error: avatarError } = await supabase.from("user_avatars").upsert({
      user_id: input.id,
      hairstyle: input.avatar.hairstyle,
      hair_color: input.avatar.hairColor,
      shirt_style: input.avatar.shirtStyle,
      shirt_color: input.avatar.shirtColor,
      bottom_style: input.avatar.bottomStyle,
      bottom_color: input.avatar.bottomColor,
      shoes: input.avatar.shoes,
      accessory: input.avatar.accessory,
      skin_tone: input.avatar.skinTone,
      avatar_customized: input.avatarCustomized,
    });
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
    const [
      { data: users, error: usersError },
      { data: avatars, error: avatarsError },
      { data: friendships, error: friendshipsError },
    ] = await Promise.all([
      supabase.from("users").select("id,email,password_hash,display_name,is_online"),
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
          hairstyle: a.hairstyle as User["avatar"]["hairstyle"],
          hairColor: String(a.hair_color),
          shirtStyle: a.shirt_style as User["avatar"]["shirtStyle"],
          shirtColor: String(a.shirt_color),
          bottomStyle: a.bottom_style as User["avatar"]["bottomStyle"],
          bottomColor: String(a.bottom_color),
          shoes: a.shoes as User["avatar"]["shoes"],
          accessory: a.accessory as User["avatar"]["accessory"],
          skinTone: String(a.skin_tone),
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
      return {
        id: String(u.id),
        email: String(u.email),
        password: String(u.password_hash),
        displayName: String(u.display_name),
        avatar: {
          ...DEFAULT_AVATAR,
          ...(av
            ? {
                hairstyle: av.hairstyle,
                hairColor: av.hairColor,
                shirtStyle: av.shirtStyle,
                shirtColor: av.shirtColor,
                bottomStyle: av.bottomStyle,
                bottomColor: av.bottomColor,
                shoes: av.shoes,
                accessory: av.accessory,
                skinTone: av.skinTone,
              }
            : {}),
        },
        friendIds: Array.from(friendMap.get(String(u.id)) ?? []),
        online: Boolean(u.is_online),
        avatarCustomized: av?.avatarCustomized ?? false,
      };
    });
  },

  async saveUsers(users: User[]): Promise<void> {
    const userRows = users.map((u) => ({
      id: u.id,
      email: u.email.toLowerCase(),
      password_hash: u.password,
      display_name: u.displayName,
      is_online: u.online,
    }));
    const avatarRows = users.map((u) => ({
      user_id: u.id,
      hairstyle: u.avatar.hairstyle,
      hair_color: u.avatar.hairColor,
      shirt_style: u.avatar.shirtStyle,
      shirt_color: u.avatar.shirtColor,
      bottom_style: u.avatar.bottomStyle,
      bottom_color: u.avatar.bottomColor,
      shoes: u.avatar.shoes,
      accessory: u.avatar.accessory,
      skin_tone: u.avatar.skinTone,
      avatar_customized: Boolean(u.avatarCustomized),
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
    const { error: avatarsUpsertError } = await supabase.from("user_avatars").upsert(avatarRows);
    throwIfError(avatarsUpsertError);

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
    const out: Record<string, string[]> = {};
    for (const row of data ?? []) {
      const roomId = String(row.room_id);
      if (!out[roomId]) out[roomId] = [];
      out[roomId].push(String(row.label).toLowerCase());
    }
    return out;
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
        map.set(k, { roomId, ownerId, grantedIds: [], pendingRequests: [] });
      }
      map.get(k)?.grantedIds.push(String(a.granted_user_id));
    }
    for (const p of pendingRows ?? []) {
      const roomId = String(p.room_id);
      const ownerId = String(p.owner_id);
      const k = key(roomId, ownerId);
      if (!map.has(k)) {
        map.set(k, { roomId, ownerId, grantedIds: [ownerId], pendingRequests: [] });
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
    return Array.from(map.values());
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
};
