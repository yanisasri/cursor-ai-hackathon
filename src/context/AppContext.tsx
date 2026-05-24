import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createRoomRecord,
  createUser,
  ensurePersonalRoomsForRoom,
  generateId,
  getCalendarConnections,
  getCalendarEvents,
  getCalendarSlots,
  getNicknameRequests,
  getNotifications,
  getPersonalRoomAccess,
  getPolls,
  getRoomNicknames,
  getRooms,
  getSessionUserId,
  getSuggestions,
  getSuggestionCategoriesByRoom,
  getUsers,
  saveCalendarConnections,
  saveCalendarEvents,
  saveCalendarSlots,
  saveNicknameRequests,
  saveNotifications,
  savePersonalRoomAccess,
  savePolls,
  saveRoomNicknames,
  saveSuggestions,
  saveSuggestionCategoriesByRoom,
  saveUsers,
  linkExistingDemoFriends,
  seedDemoFriends,
  setSessionUserId,
  verifyCredentials,
} from "../lib/storage";
import {
  MAX_ROOM_MEMBERS,
  type AvatarConfig,
  type CalendarConnection,
  type CalendarEvent,
  type CalendarSlot,
  type NicknameRequest,
  type Notification,
  type PersonalRoomAccess,
  type Poll,
  type RoomArea,
  type RoomNickname,
  type Suggestion,
  type SuggestionCategory,
  type User,
  type VirtualRoom,
} from "../types";

interface AppContextValue {
  user: User | null;
  users: User[];
  rooms: VirtualRoom[];
  calendarSlots: CalendarSlot[];
  calendarEvents: CalendarEvent[];
  calendarConnections: CalendarConnection[];
  polls: Poll[];
  suggestions: Suggestion[];
  suggestionCategoriesByRoom: Record<string, string[]>;
  notifications: Notification[];
  roomNicknames: RoomNickname[];
  nicknameRequests: NicknameRequest[];
  personalRoomAccess: PersonalRoomAccess[];
  signUp: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => void;
  updateAvatar: (avatar: AvatarConfig) => void;
  addFriendByEmail: (email: string) => Promise<{ ok: boolean; error?: string }>;
  createRoom: (data: {
    name: string;
    area: RoomArea;
    maxMembers: number;
    friendIds: string[];
    myNickname?: string;
  }) => Promise<VirtualRoom>;
  setRoomNickname: (roomId: string, userId: string, nickname: string) => void;
  requestNicknameForFriend: (
    roomId: string,
    toUserId: string,
    suggestedNickname: string
  ) => void;
  respondNicknameRequest: (id: string, accept: boolean) => void;
  getRoomDisplayName: (roomId: string, userId: string) => string;
  refresh: () => Promise<void>;
  addCalendarSlot: (slot: Omit<CalendarSlot, "id">) => void;
  addCalendarEvent: (event: Omit<CalendarEvent, "id">) => void;
  createCalendarEventRequest: (event: Omit<CalendarEvent, "id">) => void;
  rsvpCalendarEvent: (eventId: string, join: boolean) => void;
  connectGoogleCalendar: () => void;
  connectAppleCalendar: () => void;
  createPoll: (roomId: string, question: string, options: string[]) => void;
  votePoll: (pollId: string, optionId: string) => void;
  addSuggestion: (data: {
    roomId: string;
    title: string;
    category: SuggestionCategory;
    link?: string;
    imageUrl?: string;
  }) => void;
  addSuggestionCategory: (roomId: string, categoryName: string) => void;
  removeSuggestionCategoryIfEmpty: (roomId: string, categoryName: string) => boolean;
  deleteSuggestion: (id: string) => void;
  likeSuggestion: (id: string) => void;
  getWeeklyTopSuggestions: (roomId: string) => Suggestion[];
  getArchivedSuggestions: (roomId: string) => Suggestion[];
  pushNotification: (
    type: Notification["type"],
    title: string,
    message: string
  ) => void;
  markNotificationRead: (id: string) => void;
  toggleOnline: (online: boolean) => void;
  requestPersonalRoomAccess: (roomId: string, ownerId: string) => void;
  grantPersonalRoomAccess: (roomId: string, ownerId: string, userId: string) => void;
  canEnterPersonalRoom: (roomId: string, ownerId: string, userId: string) => boolean;
  ensureRoomSetup: (roomId: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [rooms, setRooms] = useState<VirtualRoom[]>([]);
  const [calendarSlots, setCalendarSlots] = useState<CalendarSlot[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [calendarConnections, setCalendarConnections] = useState<CalendarConnection[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionCategoriesByRoom, setSuggestionCategoriesByRoom] = useState<
    Record<string, string[]>
  >({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [roomNicknames, setRoomNicknames] = useState<RoomNickname[]>([]);
  const [nicknameRequests, setNicknameRequests] = useState<NicknameRequest[]>([]);
  const [personalRoomAccess, setPersonalRoomAccess] = useState<PersonalRoomAccess[]>([]);

  const loadAll = useCallback(async () => {
    const sessionId = getSessionUserId();
    const [
      allUsers,
      allRooms,
      allEvents,
      allConnections,
      allPolls,
      allSuggestions,
      allCategoryMap,
      allNotifications,
      allNicknames,
      allNicknameRequests,
      allPersonalAccess,
    ] = await Promise.all([
      getUsers(),
      getRooms(),
      getCalendarEvents(),
      getCalendarConnections(),
      getPolls(),
      getSuggestions(),
      getSuggestionCategoriesByRoom(),
      getNotifications(),
      getRoomNicknames(),
      getNicknameRequests(),
      getPersonalRoomAccess(),
    ]);

    setUsers(allUsers);
    setRooms(allRooms);
    setCalendarSlots(getCalendarSlots());
    setCalendarEvents(allEvents);
    setCalendarConnections(allConnections);
    setPolls(allPolls);
    setSuggestions(allSuggestions);
    setSuggestionCategoriesByRoom(allCategoryMap);
    setNotifications(allNotifications);
    setRoomNicknames(allNicknames);
    setNicknameRequests(allNicknameRequests);
    setPersonalRoomAccess(allPersonalAccess);
    if (sessionId) {
      const found = allUsers.find((u) => u.id === sessionId) ?? null;
      if (found) {
        try {
          await linkExistingDemoFriends(found.id);
        } catch {
          // Do not block app load if demo-linking fails.
        }
      }
      const latestUsers = await getUsers();
      setUsers(latestUsers);
      setUser(latestUsers.find((u) => u.id === sessionId) ?? found);
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      const result = await createUser(email, password);
      if (!result.ok) return result;
      setSessionUserId(result.user.id);
      try {
        await seedDemoFriends(result.user.id);
      } catch {
        // Demo seeding is optional; account creation should still succeed.
      }
      await loadAll();
      return { ok: true };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Sign up failed. Please try again.";
      return { ok: false, error: message };
    }
  }, [loadAll]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const found = await verifyCredentials(email, password);
      if (!found) return { ok: false, error: "Invalid email or password." };

      // Always update presence from fresh DB state to avoid stale in-memory overwrites.
      const allUsers = await getUsers();
      const nextUsers = allUsers.map((u) =>
        u.id === found.id ? { ...u, online: true } : u
      );
      await saveUsers(nextUsers);

      setSessionUserId(found.id);

      // Ensure demo friends are available for the signed-in user.
      try {
        await seedDemoFriends(found.id);
        await linkExistingDemoFriends(found.id);
      } catch {
        // Demo data is non-critical; do not block sign-in.
      }

      await loadAll();
      return { ok: true };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Sign in failed. Please try again.";
      return { ok: false, error: message };
    }
  }, [loadAll]);

  const signOut = useCallback(() => {
    if (user) {
      const nextUsers = users.map((u) => (u.id === user.id ? { ...u, online: false } : u));
      void saveUsers(nextUsers).then(() => loadAll());
    }
    setSessionUserId(null);
    setUser(null);
  }, [user, users, loadAll]);

  const updateAvatar = useCallback(
    (avatar: AvatarConfig) => {
      if (!user) return;
      const nextUsers = users.map((u) =>
        u.id === user.id ? { ...u, avatar, avatarCustomized: true } : u
      );
      void saveUsers(nextUsers).then(() => loadAll());
    },
    [user, users, loadAll]
  );

  const addFriendByEmail = useCallback(
    async (email: string) => {
      if (!user) return { ok: false, error: "Not signed in." };
      const normalized = email.trim().toLowerCase();
      const friend = users.find((u) => u.email === normalized);
      if (!friend) return { ok: false, error: "No user found with that email." };
      if (friend.id === user.id) return { ok: false, error: "You cannot add yourself." };
      if (user.friendIds.includes(friend.id)) {
        return { ok: false, error: "Already friends." };
      }
      const nextUsers = users.map((u) => {
        if (u.id === user.id) return { ...u, friendIds: [...u.friendIds, friend.id] };
        if (u.id === friend.id && !u.friendIds.includes(user.id)) {
          return { ...u, friendIds: [...u.friendIds, user.id] };
        }
        return u;
      });
      await saveUsers(nextUsers);
      await loadAll();
      return { ok: true };
    },
    [user, users, loadAll]
  );

  const setRoomNickname = useCallback(
    (roomId: string, userId: string, nickname: string) => {
      const trimmed = nickname.trim();
      if (!trimmed) return;
      const all = roomNicknames.filter(
        (n) => !(n.roomId === roomId && n.userId === userId)
      );
      void saveRoomNicknames([...all, { roomId, userId, nickname: trimmed }]).then(() =>
        loadAll()
      );
    },
    [roomNicknames, loadAll]
  );

  const requestNicknameForFriend = useCallback(
    (roomId: string, toUserId: string, suggestedNickname: string) => {
      if (!user) return;
      const req: NicknameRequest = {
        id: generateId(),
        roomId,
        fromUserId: user.id,
        toUserId,
        suggestedNickname: suggestedNickname.trim(),
        status: "pending",
      };
      void saveNicknameRequests([...nicknameRequests, req]).then(() => loadAll());
    },
    [user, nicknameRequests, loadAll]
  );

  const respondNicknameRequest = useCallback(
    (id: string, accept: boolean) => {
      const reqs = nicknameRequests;
      const req = reqs.find((r) => r.id === id);
      if (!req) return;
      const updated = reqs.map((r) =>
        r.id === id ? { ...r, status: accept ? "accepted" as const : "declined" as const } : r
      );
      void saveNicknameRequests(updated);
      if (accept) {
        setRoomNickname(req.roomId, req.toUserId, req.suggestedNickname);
      }
      void loadAll();
    },
    [nicknameRequests, loadAll, setRoomNickname]
  );

  const getRoomDisplayName = useCallback(
    (roomId: string, userId: string) => {
      const nick = roomNicknames.find(
        (n) => n.roomId === roomId && n.userId === userId
      );
      if (nick) return nick.nickname;
      return users.find((u) => u.id === userId)?.displayName ?? "Friend";
    },
    [roomNicknames, users]
  );

  const createRoom = useCallback(
    async (data: {
      name: string;
      area: RoomArea;
      maxMembers: number;
      friendIds: string[];
      myNickname?: string;
    }) => {
      if (!user) throw new Error("Not signed in");
      const memberIds = Array.from(new Set([user.id, ...data.friendIds])).slice(
        0,
        Math.min(data.maxMembers, MAX_ROOM_MEMBERS)
      );

      const room: VirtualRoom = {
        id: generateId(),
        name: data.name,
        area: data.area,
        maxMembers: Math.min(data.maxMembers, MAX_ROOM_MEMBERS),
        memberIds,
        ownerId: user.id,
        createdAt: new Date().toISOString(),
      };
      await createRoomRecord(room);
      if (data.myNickname?.trim()) {
        setRoomNickname(room.id, user.id, data.myNickname.trim());
      }
      try {
        await ensurePersonalRoomsForRoom(room);
      } catch {
        // Personal-room setup should not block entering a newly created room.
      }
      await loadAll();
      return room;
    },
    [user, loadAll, setRoomNickname]
  );

  const ensureRoomSetup = useCallback(
    (roomId: string) => {
      const room = rooms.find((r) => r.id === roomId);
      if (room) void ensurePersonalRoomsForRoom(room).then(() => loadAll());
    },
    [rooms, loadAll]
  );

  const addCalendarSlot = useCallback(
    (slot: Omit<CalendarSlot, "id">) => {
      saveCalendarSlots([...getCalendarSlots(), { ...slot, id: generateId() }]);
      void loadAll();
    },
    [loadAll]
  );

  const addCalendarEvent = useCallback(
    (event: Omit<CalendarEvent, "id">) => {
      void saveCalendarEvents([...calendarEvents, { ...event, id: generateId() }]).then(() =>
        loadAll()
      );
    },
    [calendarEvents, loadAll]
  );

  const createCalendarEventRequest = useCallback(
    (event: Omit<CalendarEvent, "id">) => {
      const request: CalendarEvent = {
        ...event,
        id: generateId(),
        status: "pending",
        rsvpUserIds: [],
        syncedToGoogleUserIds: [],
        syncedToAppleUserIds: [],
      };
      void saveCalendarEvents([...calendarEvents, request]).then(() => loadAll());
    },
    [calendarEvents, loadAll]
  );

  const rsvpCalendarEvent = useCallback(
    (eventId: string, join: boolean) => {
      if (!user) return;
      const updated: CalendarEvent[] = calendarEvents.map((e): CalendarEvent => {
        if (e.id !== eventId) return e;
        const current = e.rsvpUserIds ?? [];
        const nextRsvps = join
          ? [...new Set([...current, user.id])]
          : current.filter((id) => id !== user.id);
        const isConfirmed = nextRsvps.length > 0;
        const userConn = calendarConnections.find((c) => c.userId === user.id);
        return {
          ...e,
          status: isConfirmed ? "confirmed" : "pending",
          rsvpUserIds: nextRsvps,
          syncedToGoogleUserIds:
            join && userConn?.googleConnected
              ? [...new Set([...(e.syncedToGoogleUserIds ?? []), user.id])]
              : e.syncedToGoogleUserIds ?? [],
          syncedToAppleUserIds:
            join && userConn?.appleConnected
              ? [...new Set([...(e.syncedToAppleUserIds ?? []), user.id])]
              : e.syncedToAppleUserIds ?? [],
        };
      });
      void saveCalendarEvents(updated).then(() => loadAll());
    },
    [user, calendarEvents, calendarConnections, loadAll]
  );

  const connectGoogleCalendar = useCallback(() => {
    if (!user) return;
    const all = calendarConnections;
    const existing = all.find((c) => c.userId === user.id);
    const next = existing
      ? all.map((c) =>
          c.userId === user.id ? { ...c, googleConnected: true } : c
        )
      : [...all, { userId: user.id, googleConnected: true, appleConnected: false }];
    void saveCalendarConnections(next);
    const demoEvents: CalendarEvent[] = [
      {
        id: generateId(),
        roomId: "",
        userId: user.id,
        title: "Study block (Google)",
        location: "Library",
        startAt: new Date(Date.now() + 86400000).toISOString(),
        endAt: new Date(Date.now() + 86400000 + 7200000).toISOString(),
        source: "google",
      },
    ];
    void saveCalendarEvents([...calendarEvents, ...demoEvents]).then(() => loadAll());
  }, [user, calendarConnections, calendarEvents, loadAll]);

  const connectAppleCalendar = useCallback(() => {
    if (!user) return;
    const all = calendarConnections;
    const existing = all.find((c) => c.userId === user.id);
    const next = existing
      ? all.map((c) =>
          c.userId === user.id ? { ...c, appleConnected: true } : c
        )
      : [...all, { userId: user.id, googleConnected: false, appleConnected: true }];
    void saveCalendarConnections(next).then(() => loadAll());
  }, [user, calendarConnections, loadAll]);

  const createPoll = useCallback(
    (roomId: string, question: string, options: string[]) => {
      if (!user) return;
      const nextPolls = [
        ...polls,
        {
          id: generateId(),
          roomId,
          question,
          options: options.map((text) => ({ id: generateId(), text, votes: [] })),
          createdBy: user.id,
        },
      ];
      const nextNotifications = [
        ...notifications,
        {
          id: generateId(),
          userId: user.id,
          type: "decision" as const,
          title: "New poll",
          message: question,
          read: false,
          createdAt: new Date().toISOString(),
        },
      ];
      void Promise.all([savePolls(nextPolls), saveNotifications(nextNotifications)]).then(() =>
        loadAll()
      );
    },
    [user, polls, notifications, loadAll]
  );

  const votePoll = useCallback(
    (pollId: string, optionId: string) => {
      if (!user) return;
      void savePolls(
        polls.map((p) =>
          p.id !== pollId
            ? p
            : {
                ...p,
                options: p.options.map((o) => {
                  const without = o.votes.filter((v) => v !== user.id);
                  return o.id === optionId
                    ? { ...o, votes: [...without, user.id] }
                    : { ...o, votes: without };
                }),
              }
        )
      ).then(() => loadAll());
    },
    [user, polls, loadAll]
  );

  const addSuggestion = useCallback(
    (data: {
      roomId: string;
      title: string;
      category: SuggestionCategory;
      link?: string;
      imageUrl?: string;
    }) => {
      if (!user) return;
      const item: Suggestion = {
        id: generateId(),
        roomId: data.roomId,
        title: data.title,
        category: data.category,
        addedBy: user.id,
        likes: [],
        link: data.link,
        imageUrl: data.imageUrl,
        createdAt: new Date().toISOString(),
        archived: false,
      };
      void saveSuggestions([...suggestions, item]).then(() => loadAll());
    },
    [user, suggestions, loadAll]
  );

  const addSuggestionCategory = useCallback(
    (roomId: string, categoryName: string) => {
      const normalized = categoryName.trim().toLowerCase();
      if (!normalized) return;
      const all = suggestionCategoriesByRoom;
      const existing = all[roomId] ?? [];
      if (existing.includes(normalized)) return;
      void saveSuggestionCategoriesByRoom({
        ...all,
        [roomId]: [...existing, normalized],
      }).then(() => loadAll());
    },
    [suggestionCategoriesByRoom, loadAll]
  );

  const removeSuggestionCategoryIfEmpty = useCallback(
    (roomId: string, categoryName: string) => {
      const normalized = categoryName.trim().toLowerCase();
      if (!normalized || normalized === "other") return false;
      const hasAnySuggestions = suggestions.some(
        (s) => s.roomId === roomId && s.category.toLowerCase() === normalized
      );
      if (hasAnySuggestions) return false;
      const all = suggestionCategoriesByRoom;
      const existing = all[roomId] ?? [];
      if (!existing.includes(normalized)) return false;
      void saveSuggestionCategoriesByRoom({
        ...all,
        [roomId]: existing.filter((c) => c !== normalized),
      }).then(() => loadAll());
      return true;
    },
    [suggestions, suggestionCategoriesByRoom, loadAll]
  );

  const deleteSuggestion = useCallback(
    (id: string) => {
      if (!user) return;
      const item = suggestions.find((s) => s.id === id);
      if (!item || item.addedBy !== user.id) return;
      void saveSuggestions(suggestions.filter((s) => s.id !== id)).then(() => loadAll());
    },
    [user, suggestions, loadAll]
  );

  const likeSuggestion = useCallback(
    (id: string) => {
      if (!user) return;
      void saveSuggestions(
        suggestions.map((s) => {
          if (s.id !== id) return s;
          const has = s.likes.includes(user.id);
          return {
            ...s,
            likes: has ? s.likes.filter((l) => l !== user.id) : [...s.likes, user.id],
          };
        })
      ).then(() => loadAll());
    },
    [user, suggestions, loadAll]
  );

  const getWeeklyTopSuggestions = useCallback((roomId: string) => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return suggestions
      .filter(
        (s) =>
          s.roomId === roomId &&
          !s.archived &&
          new Date(s.createdAt).getTime() >= weekAgo
      )
      .sort((a, b) => b.likes.length - a.likes.length)
      .slice(0, 10);
  }, [suggestions]);

  const getArchivedSuggestions = useCallback((roomId: string) => {
    return suggestions.filter((s) => s.roomId === roomId && s.archived);
  }, [suggestions]);

  const pushNotification = useCallback(
    (type: Notification["type"], title: string, message: string) => {
      if (!user) return;
      void saveNotifications([
        ...notifications,
        {
          id: generateId(),
          userId: user.id,
          type,
          title,
          message,
          read: false,
          createdAt: new Date().toISOString(),
        },
      ]).then(() => loadAll());
    },
    [user, notifications, loadAll]
  );

  const markNotificationRead = useCallback(
    (id: string) => {
      void saveNotifications(
        notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
      ).then(() => loadAll());
    },
    [notifications, loadAll]
  );

  const toggleOnline = useCallback(
    (online: boolean) => {
      if (!user) return;
      void saveUsers(users.map((u) => (u.id === user.id ? { ...u, online } : u))).then(() =>
        loadAll()
      );
    },
    [user, users, loadAll]
  );

  const requestPersonalRoomAccess = useCallback(
    (roomId: string, ownerId: string) => {
      if (!user) return;
      const all = personalRoomAccess;
      const idx = all.findIndex((a) => a.roomId === roomId && a.ownerId === ownerId);
      if (idx < 0) return;
      const entry = all[idx];
      if (entry.grantedIds.includes(user.id)) return;
      if (entry.pendingRequests.some((r) => r.userId === user.id)) return;
      const updated = [...all];
      updated[idx] = {
        ...entry,
        pendingRequests: [
          ...entry.pendingRequests,
          { userId: user.id, requestedAt: new Date().toISOString() },
        ],
      };
      void savePersonalRoomAccess(updated).then(() => loadAll());
    },
    [user, personalRoomAccess, loadAll]
  );

  const grantPersonalRoomAccess = useCallback(
    (roomId: string, ownerId: string, grantUserId: string) => {
      const all = personalRoomAccess;
      const idx = all.findIndex((a) => a.roomId === roomId && a.ownerId === ownerId);
      if (idx < 0) return;
      const entry = all[idx];
      const updated = [...all];
      updated[idx] = {
        ...entry,
        grantedIds: [...new Set([...entry.grantedIds, grantUserId])],
        pendingRequests: entry.pendingRequests.filter((r) => r.userId !== grantUserId),
      };
      void savePersonalRoomAccess(updated).then(() => loadAll());
    },
    [personalRoomAccess, loadAll]
  );

  const canEnterPersonalRoom = useCallback(
    (roomId: string, ownerId: string, visitorId: string) => {
      const entry = personalRoomAccess.find(
        (a) => a.roomId === roomId && a.ownerId === ownerId
      );
      return entry?.grantedIds.includes(visitorId) ?? false;
    },
    [personalRoomAccess]
  );

  const value = useMemo(
    () => ({
      user,
      users,
      rooms,
      calendarSlots,
      calendarEvents,
      calendarConnections,
      polls,
      suggestions,
      suggestionCategoriesByRoom,
      notifications,
      roomNicknames,
      nicknameRequests,
      personalRoomAccess,
      signUp,
      signIn,
      signOut,
      updateAvatar,
      addFriendByEmail,
      createRoom,
      setRoomNickname,
      requestNicknameForFriend,
      respondNicknameRequest,
      getRoomDisplayName,
      refresh: loadAll,
      addCalendarSlot,
      addCalendarEvent,
      createCalendarEventRequest,
      rsvpCalendarEvent,
      connectGoogleCalendar,
      connectAppleCalendar,
      createPoll,
      votePoll,
      addSuggestion,
      addSuggestionCategory,
      removeSuggestionCategoryIfEmpty,
      deleteSuggestion,
      likeSuggestion,
      getWeeklyTopSuggestions,
      getArchivedSuggestions,
      pushNotification,
      markNotificationRead,
      toggleOnline,
      requestPersonalRoomAccess,
      grantPersonalRoomAccess,
      canEnterPersonalRoom,
      ensureRoomSetup,
    }),
    [
      user,
      users,
      rooms,
      calendarSlots,
      calendarEvents,
      calendarConnections,
      polls,
      suggestions,
      suggestionCategoriesByRoom,
      notifications,
      roomNicknames,
      nicknameRequests,
      personalRoomAccess,
      signUp,
      signIn,
      signOut,
      updateAvatar,
      addFriendByEmail,
      createRoom,
      setRoomNickname,
      requestNicknameForFriend,
      respondNicknameRequest,
      getRoomDisplayName,
      loadAll,
      addCalendarSlot,
      addCalendarEvent,
      createCalendarEventRequest,
      rsvpCalendarEvent,
      connectGoogleCalendar,
      connectAppleCalendar,
      createPoll,
      votePoll,
      addSuggestion,
      addSuggestionCategory,
      removeSuggestionCategoryIfEmpty,
      deleteSuggestion,
      likeSuggestion,
      getWeeklyTopSuggestions,
      getArchivedSuggestions,
      pushNotification,
      markNotificationRead,
      toggleOnline,
      requestPersonalRoomAccess,
      grantPersonalRoomAccess,
      canEnterPersonalRoom,
      ensureRoomSetup,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
