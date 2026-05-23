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
  saveRooms,
  saveSuggestions,
  saveSuggestionCategoriesByRoom,
  saveUsers,
  linkExistingDemoFriends,
  seedDemoFriends,
  setSessionUserId,
} from "../lib/storage";
import {
  DEFAULT_AVATAR,
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
  signUp: (email: string, password: string) => { ok: boolean; error?: string };
  signIn: (email: string, password: string) => { ok: boolean; error?: string };
  signOut: () => void;
  updateAvatar: (avatar: AvatarConfig) => void;
  addFriendByEmail: (email: string) => { ok: boolean; error?: string };
  createRoom: (data: {
    name: string;
    area: RoomArea;
    maxMembers: number;
    friendIds: string[];
    myNickname?: string;
  }) => VirtualRoom;
  setRoomNickname: (roomId: string, userId: string, nickname: string) => void;
  requestNicknameForFriend: (
    roomId: string,
    toUserId: string,
    suggestedNickname: string
  ) => void;
  respondNicknameRequest: (id: string, accept: boolean) => void;
  getRoomDisplayName: (roomId: string, userId: string) => string;
  refresh: () => void;
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

  const loadAll = useCallback(() => {
    const allUsers = getUsers();
    const sessionId = getSessionUserId();
    setUsers(allUsers);
    setRooms(getRooms());
    setCalendarSlots(getCalendarSlots());
    setCalendarEvents(getCalendarEvents());
    setCalendarConnections(getCalendarConnections());
    setPolls(getPolls());
    setSuggestions(getSuggestions());
    setSuggestionCategoriesByRoom(getSuggestionCategoriesByRoom());
    setNotifications(getNotifications());
    setRoomNicknames(getRoomNicknames());
    setNicknameRequests(getNicknameRequests());
    setPersonalRoomAccess(getPersonalRoomAccess());
    if (sessionId) {
      const found = allUsers.find((u) => u.id === sessionId) ?? null;
      if (found) linkExistingDemoFriends(found.id);
      setUser(getUsers().find((u) => u.id === sessionId) ?? found);
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const signUp = useCallback((email: string, password: string) => {
    const normalized = email.trim().toLowerCase();
    if (!normalized || password.length < 6) {
      return { ok: false, error: "Email required and password must be at least 6 characters." };
    }
    const all = getUsers();
    if (all.some((u) => u.email === normalized)) {
      return { ok: false, error: "An account with this email already exists." };
    }
    const newUser: User = {
      id: generateId(),
      email: normalized,
      password,
      displayName: normalized.split("@")[0],
      avatar: { ...DEFAULT_AVATAR },
      friendIds: [],
      online: true,
      avatarCustomized: false,
    };
    saveUsers([...all, newUser]);
    setSessionUserId(newUser.id);
    seedDemoFriends(newUser.id);
    loadAll();
    return { ok: true };
  }, [loadAll]);

  const signIn = useCallback((email: string, password: string) => {
    const normalized = email.trim().toLowerCase();
    const found = getUsers().find(
      (u) => u.email === normalized && u.password === password
    );
    if (!found) return { ok: false, error: "Invalid email or password." };
    saveUsers(getUsers().map((u) => (u.id === found.id ? { ...u, online: true } : u)));
    setSessionUserId(found.id);
    loadAll();
    return { ok: true };
  }, [loadAll]);

  const signOut = useCallback(() => {
    if (user) {
      saveUsers(getUsers().map((u) => (u.id === user.id ? { ...u, online: false } : u)));
    }
    setSessionUserId(null);
    setUser(null);
    loadAll();
  }, [user, loadAll]);

  const updateAvatar = useCallback(
    (avatar: AvatarConfig) => {
      if (!user) return;
      saveUsers(
        getUsers().map((u) =>
          u.id === user.id ? { ...u, avatar, avatarCustomized: true } : u
        )
      );
      loadAll();
    },
    [user, loadAll]
  );

  const addFriendByEmail = useCallback(
    (email: string) => {
      if (!user) return { ok: false, error: "Not signed in." };
      const normalized = email.trim().toLowerCase();
      const friend = getUsers().find((u) => u.email === normalized);
      if (!friend) return { ok: false, error: "No user found with that email." };
      if (friend.id === user.id) return { ok: false, error: "You cannot add yourself." };
      if (user.friendIds.includes(friend.id)) {
        return { ok: false, error: "Already friends." };
      }
      saveUsers(
        getUsers().map((u) => {
          if (u.id === user.id) return { ...u, friendIds: [...u.friendIds, friend.id] };
          if (u.id === friend.id && !u.friendIds.includes(user.id)) {
            return { ...u, friendIds: [...u.friendIds, user.id] };
          }
          return u;
        })
      );
      loadAll();
      return { ok: true };
    },
    [user, loadAll]
  );

  const setRoomNickname = useCallback(
    (roomId: string, userId: string, nickname: string) => {
      const trimmed = nickname.trim();
      if (!trimmed) return;
      const all = getRoomNicknames().filter(
        (n) => !(n.roomId === roomId && n.userId === userId)
      );
      saveRoomNicknames([...all, { roomId, userId, nickname: trimmed }]);
      loadAll();
    },
    [loadAll]
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
      saveNicknameRequests([...getNicknameRequests(), req]);
      loadAll();
    },
    [user, loadAll]
  );

  const respondNicknameRequest = useCallback(
    (id: string, accept: boolean) => {
      const reqs = getNicknameRequests();
      const req = reqs.find((r) => r.id === id);
      if (!req) return;
      const updated = reqs.map((r) =>
        r.id === id ? { ...r, status: accept ? "accepted" as const : "declined" as const } : r
      );
      saveNicknameRequests(updated);
      if (accept) {
        setRoomNickname(req.roomId, req.toUserId, req.suggestedNickname);
      }
      loadAll();
    },
    [loadAll, setRoomNickname]
  );

  const getRoomDisplayName = useCallback(
    (roomId: string, userId: string) => {
      const nick = getRoomNicknames().find(
        (n) => n.roomId === roomId && n.userId === userId
      );
      if (nick) return nick.nickname;
      return getUsers().find((u) => u.id === userId)?.displayName ?? "Friend";
    },
    []
  );

  const createRoom = useCallback(
    (data: {
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
      saveRooms([...getRooms(), room]);
      if (data.myNickname?.trim()) {
        setRoomNickname(room.id, user.id, data.myNickname.trim());
      }
      ensurePersonalRoomsForRoom(room);
      loadAll();
      return room;
    },
    [user, loadAll, setRoomNickname]
  );

  const ensureRoomSetup = useCallback(
    (roomId: string) => {
      const room = getRooms().find((r) => r.id === roomId);
      if (room) ensurePersonalRoomsForRoom(room);
      loadAll();
    },
    [loadAll]
  );

  const addCalendarSlot = useCallback(
    (slot: Omit<CalendarSlot, "id">) => {
      saveCalendarSlots([...getCalendarSlots(), { ...slot, id: generateId() }]);
      loadAll();
    },
    [loadAll]
  );

  const addCalendarEvent = useCallback(
    (event: Omit<CalendarEvent, "id">) => {
      saveCalendarEvents([...getCalendarEvents(), { ...event, id: generateId() }]);
      loadAll();
    },
    [loadAll]
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
      saveCalendarEvents([...getCalendarEvents(), request]);
      loadAll();
    },
    [loadAll]
  );

  const rsvpCalendarEvent = useCallback(
    (eventId: string, join: boolean) => {
      if (!user) return;
      const updated: CalendarEvent[] = getCalendarEvents().map((e): CalendarEvent => {
        if (e.id !== eventId) return e;
        const current = e.rsvpUserIds ?? [];
        const nextRsvps = join
          ? [...new Set([...current, user.id])]
          : current.filter((id) => id !== user.id);
        const isConfirmed = nextRsvps.length > 0;
        const userConn = getCalendarConnections().find((c) => c.userId === user.id);
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
      saveCalendarEvents(updated);
      loadAll();
    },
    [user, loadAll]
  );

  const connectGoogleCalendar = useCallback(() => {
    if (!user) return;
    const all = getCalendarConnections();
    const existing = all.find((c) => c.userId === user.id);
    const next = existing
      ? all.map((c) =>
          c.userId === user.id ? { ...c, googleConnected: true } : c
        )
      : [...all, { userId: user.id, googleConnected: true, appleConnected: false }];
    saveCalendarConnections(next);
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
    saveCalendarEvents([...getCalendarEvents(), ...demoEvents]);
    loadAll();
  }, [user, loadAll]);

  const connectAppleCalendar = useCallback(() => {
    if (!user) return;
    const all = getCalendarConnections();
    const existing = all.find((c) => c.userId === user.id);
    const next = existing
      ? all.map((c) =>
          c.userId === user.id ? { ...c, appleConnected: true } : c
        )
      : [...all, { userId: user.id, googleConnected: false, appleConnected: true }];
    saveCalendarConnections(next);
    loadAll();
  }, [user, loadAll]);

  const createPoll = useCallback(
    (roomId: string, question: string, options: string[]) => {
      if (!user) return;
      savePolls([
        ...getPolls(),
        {
          id: generateId(),
          roomId,
          question,
          options: options.map((text) => ({ id: generateId(), text, votes: [] })),
          createdBy: user.id,
        },
      ]);
      saveNotifications([
        ...getNotifications(),
        {
          id: generateId(),
          userId: user.id,
          type: "decision",
          title: "New poll",
          message: question,
          read: false,
          createdAt: new Date().toISOString(),
        },
      ]);
      loadAll();
    },
    [user, loadAll]
  );

  const votePoll = useCallback(
    (pollId: string, optionId: string) => {
      if (!user) return;
      savePolls(
        getPolls().map((p) =>
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
      );
      loadAll();
    },
    [user, loadAll]
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
      saveSuggestions([...getSuggestions(), item]);
      loadAll();
    },
    [user, loadAll]
  );

  const addSuggestionCategory = useCallback(
    (roomId: string, categoryName: string) => {
      const normalized = categoryName.trim().toLowerCase();
      if (!normalized) return;
      const all = getSuggestionCategoriesByRoom();
      const existing = all[roomId] ?? [];
      if (existing.includes(normalized)) return;
      saveSuggestionCategoriesByRoom({
        ...all,
        [roomId]: [...existing, normalized],
      });
      loadAll();
    },
    [loadAll]
  );

  const removeSuggestionCategoryIfEmpty = useCallback(
    (roomId: string, categoryName: string) => {
      const normalized = categoryName.trim().toLowerCase();
      if (!normalized || normalized === "other") return false;
      const hasAnySuggestions = getSuggestions().some(
        (s) => s.roomId === roomId && s.category.toLowerCase() === normalized
      );
      if (hasAnySuggestions) return false;
      const all = getSuggestionCategoriesByRoom();
      const existing = all[roomId] ?? [];
      if (!existing.includes(normalized)) return false;
      saveSuggestionCategoriesByRoom({
        ...all,
        [roomId]: existing.filter((c) => c !== normalized),
      });
      loadAll();
      return true;
    },
    [loadAll]
  );

  const deleteSuggestion = useCallback(
    (id: string) => {
      if (!user) return;
      const item = getSuggestions().find((s) => s.id === id);
      if (!item || item.addedBy !== user.id) return;
      saveSuggestions(getSuggestions().filter((s) => s.id !== id));
      loadAll();
    },
    [user, loadAll]
  );

  const likeSuggestion = useCallback(
    (id: string) => {
      if (!user) return;
      saveSuggestions(
        getSuggestions().map((s) => {
          if (s.id !== id) return s;
          const has = s.likes.includes(user.id);
          return {
            ...s,
            likes: has ? s.likes.filter((l) => l !== user.id) : [...s.likes, user.id],
          };
        })
      );
      loadAll();
    },
    [user, loadAll]
  );

  const getWeeklyTopSuggestions = useCallback((roomId: string) => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return getSuggestions()
      .filter(
        (s) =>
          s.roomId === roomId &&
          !s.archived &&
          new Date(s.createdAt).getTime() >= weekAgo
      )
      .sort((a, b) => b.likes.length - a.likes.length)
      .slice(0, 10);
  }, []);

  const getArchivedSuggestions = useCallback((roomId: string) => {
    return getSuggestions().filter((s) => s.roomId === roomId && s.archived);
  }, []);

  const pushNotification = useCallback(
    (type: Notification["type"], title: string, message: string) => {
      if (!user) return;
      saveNotifications([
        ...getNotifications(),
        {
          id: generateId(),
          userId: user.id,
          type,
          title,
          message,
          read: false,
          createdAt: new Date().toISOString(),
        },
      ]);
      loadAll();
    },
    [user, loadAll]
  );

  const markNotificationRead = useCallback(
    (id: string) => {
      saveNotifications(
        getNotifications().map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      loadAll();
    },
    [loadAll]
  );

  const toggleOnline = useCallback(
    (online: boolean) => {
      if (!user) return;
      saveUsers(getUsers().map((u) => (u.id === user.id ? { ...u, online } : u)));
      loadAll();
    },
    [user, loadAll]
  );

  const requestPersonalRoomAccess = useCallback(
    (roomId: string, ownerId: string) => {
      if (!user) return;
      const all = getPersonalRoomAccess();
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
      savePersonalRoomAccess(updated);
      loadAll();
    },
    [user, loadAll]
  );

  const grantPersonalRoomAccess = useCallback(
    (roomId: string, ownerId: string, grantUserId: string) => {
      const all = getPersonalRoomAccess();
      const idx = all.findIndex((a) => a.roomId === roomId && a.ownerId === ownerId);
      if (idx < 0) return;
      const entry = all[idx];
      const updated = [...all];
      updated[idx] = {
        ...entry,
        grantedIds: [...new Set([...entry.grantedIds, grantUserId])],
        pendingRequests: entry.pendingRequests.filter((r) => r.userId !== grantUserId),
      };
      savePersonalRoomAccess(updated);
      loadAll();
    },
    [loadAll]
  );

  const canEnterPersonalRoom = useCallback(
    (roomId: string, ownerId: string, visitorId: string) => {
      const entry = getPersonalRoomAccess().find(
        (a) => a.roomId === roomId && a.ownerId === ownerId
      );
      return entry?.grantedIds.includes(visitorId) ?? false;
    },
    []
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
