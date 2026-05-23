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
  generateId,
  getCalendarSlots,
  getNotifications,
  getPolls,
  getRooms,
  getSessionUserId,
  getSuggestions,
  getUsers,
  saveCalendarSlots,
  saveNotifications,
  savePolls,
  saveRooms,
  saveSuggestions,
  saveUsers,
  seedDemoFriends,
  setSessionUserId,
} from "../lib/storage";
import {
  DEFAULT_AVATAR,
  MAX_ROOM_MEMBERS,
  type AvatarConfig,
  type CalendarSlot,
  type Notification,
  type Poll,
  type RoomArea,
  type Suggestion,
  type User,
  type VirtualRoom,
} from "../types";

interface AppContextValue {
  user: User | null;
  users: User[];
  rooms: VirtualRoom[];
  calendarSlots: CalendarSlot[];
  polls: Poll[];
  suggestions: Suggestion[];
  notifications: Notification[];
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
  }) => VirtualRoom;
  refresh: () => void;
  addCalendarSlot: (slot: Omit<CalendarSlot, "id">) => void;
  createPoll: (roomId: string, question: string, options: string[]) => void;
  votePoll: (pollId: string, optionId: string) => void;
  addSuggestion: (
    roomId: string,
    title: string,
    category: Suggestion["category"]
  ) => void;
  likeSuggestion: (id: string) => void;
  pushNotification: (
    type: Notification["type"],
    title: string,
    message: string
  ) => void;
  markNotificationRead: (id: string) => void;
  toggleOnline: (online: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [rooms, setRooms] = useState<VirtualRoom[]>([]);
  const [calendarSlots, setCalendarSlots] = useState<CalendarSlot[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadAll = useCallback(() => {
    const allUsers = getUsers();
    const sessionId = getSessionUserId();
    setUsers(allUsers);
    setRooms(getRooms());
    setCalendarSlots(getCalendarSlots());
    setPolls(getPolls());
    setSuggestions(getSuggestions());
    setNotifications(getNotifications());
    if (sessionId) {
      const found = allUsers.find((u) => u.id === sessionId) ?? null;
      setUser(found);
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
    if (!found) {
      return { ok: false, error: "Invalid email or password." };
    }
    const updated = getUsers().map((u) =>
      u.id === found.id ? { ...u, online: true } : u
    );
    saveUsers(updated);
    setSessionUserId(found.id);
    loadAll();
    return { ok: true };
  }, [loadAll]);

  const signOut = useCallback(() => {
    if (user) {
      const updated = getUsers().map((u) =>
        u.id === user.id ? { ...u, online: false } : u
      );
      saveUsers(updated);
    }
    setSessionUserId(null);
    setUser(null);
    loadAll();
  }, [user, loadAll]);

  const updateAvatar = useCallback(
    (avatar: AvatarConfig) => {
      if (!user) return;
      const updated = getUsers().map((u) =>
        u.id === user.id ? { ...u, avatar } : u
      );
      saveUsers(updated);
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
      const updated = getUsers().map((u) => {
        if (u.id === user.id) {
          return { ...u, friendIds: [...u.friendIds, friend.id] };
        }
        if (u.id === friend.id && !u.friendIds.includes(user.id)) {
          return { ...u, friendIds: [...u.friendIds, user.id] };
        }
        return u;
      });
      saveUsers(updated);
      loadAll();
      return { ok: true };
    },
    [user, loadAll]
  );

  const createRoom = useCallback(
    (data: {
      name: string;
      area: RoomArea;
      maxMembers: number;
      friendIds: string[];
    }) => {
      if (!user) throw new Error("Not signed in");
      const memberIds = Array.from(
        new Set([user.id, ...data.friendIds])
      ).slice(0, Math.min(data.maxMembers, MAX_ROOM_MEMBERS));

      const room: VirtualRoom = {
        id: generateId(),
        name: data.name,
        area: data.area,
        maxMembers: Math.min(data.maxMembers, MAX_ROOM_MEMBERS),
        memberIds,
        ownerId: user.id,
        createdAt: new Date().toISOString(),
      };
      const allRooms = [...getRooms(), room];
      saveRooms(allRooms);
      loadAll();
      return room;
    },
    [user, loadAll]
  );

  const addCalendarSlot = useCallback(
    (slot: Omit<CalendarSlot, "id">) => {
      const next = [...getCalendarSlots(), { ...slot, id: generateId() }];
      saveCalendarSlots(next);
      loadAll();
    },
    [loadAll]
  );

  const createPoll = useCallback(
    (roomId: string, question: string, options: string[]) => {
      if (!user) return;
      const poll: Poll = {
        id: generateId(),
        roomId,
        question,
        options: options.map((text) => ({
          id: generateId(),
          text,
          votes: [],
        })),
        createdBy: user.id,
      };
      savePolls([...getPolls(), poll]);
      const notif: Notification = {
        id: generateId(),
        userId: user.id,
        type: "decision",
        title: "New poll",
        message: question,
        read: false,
        createdAt: new Date().toISOString(),
      };
      saveNotifications([...getNotifications(), notif]);
      loadAll();
    },
    [user, loadAll]
  );

  const votePoll = useCallback(
    (pollId: string, optionId: string) => {
      if (!user) return;
      const updated = getPolls().map((p) => {
        if (p.id !== pollId) return p;
        return {
          ...p,
          options: p.options.map((o) => {
            const without = o.votes.filter((v) => v !== user.id);
            if (o.id === optionId) {
              return { ...o, votes: [...without, user.id] };
            }
            return { ...o, votes: without };
          }),
        };
      });
      savePolls(updated);
      loadAll();
    },
    [user, loadAll]
  );

  const addSuggestion = useCallback(
    (
      roomId: string,
      title: string,
      category: Suggestion["category"]
    ) => {
      if (!user) return;
      const item: Suggestion = {
        id: generateId(),
        roomId,
        title,
        category,
        addedBy: user.id,
        likes: [],
      };
      saveSuggestions([...getSuggestions(), item]);
      loadAll();
    },
    [user, loadAll]
  );

  const likeSuggestion = useCallback(
    (id: string) => {
      if (!user) return;
      const updated = getSuggestions().map((s) => {
        if (s.id !== id) return s;
        const has = s.likes.includes(user.id);
        return {
          ...s,
          likes: has
            ? s.likes.filter((l) => l !== user.id)
            : [...s.likes, user.id],
        };
      });
      saveSuggestions(updated);
      loadAll();
    },
    [user, loadAll]
  );

  const pushNotification = useCallback(
    (type: Notification["type"], title: string, message: string) => {
      if (!user) return;
      const n: Notification = {
        id: generateId(),
        userId: user.id,
        type,
        title,
        message,
        read: false,
        createdAt: new Date().toISOString(),
      };
      saveNotifications([...getNotifications(), n]);
      loadAll();
    },
    [user, loadAll]
  );

  const markNotificationRead = useCallback(
    (id: string) => {
      const updated = getNotifications().map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      saveNotifications(updated);
      loadAll();
    },
    [loadAll]
  );

  const toggleOnline = useCallback(
    (online: boolean) => {
      if (!user) return;
      const updated = getUsers().map((u) =>
        u.id === user.id ? { ...u, online } : u
      );
      saveUsers(updated);
      loadAll();
    },
    [user, loadAll]
  );

  const value = useMemo(
    () => ({
      user,
      users,
      rooms,
      calendarSlots,
      polls,
      suggestions,
      notifications,
      signUp,
      signIn,
      signOut,
      updateAvatar,
      addFriendByEmail,
      createRoom,
      refresh: loadAll,
      addCalendarSlot,
      createPoll,
      votePoll,
      addSuggestion,
      likeSuggestion,
      pushNotification,
      markNotificationRead,
      toggleOnline,
    }),
    [
      user,
      users,
      rooms,
      calendarSlots,
      polls,
      suggestions,
      notifications,
      signUp,
      signIn,
      signOut,
      updateAvatar,
      addFriendByEmail,
      createRoom,
      loadAll,
      addCalendarSlot,
      createPoll,
      votePoll,
      addSuggestion,
      likeSuggestion,
      pushNotification,
      markNotificationRead,
      toggleOnline,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
