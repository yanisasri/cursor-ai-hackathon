import type {
  CalendarConnection,
  CalendarEvent,
  CalendarSlot,
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
import { ARCHIVE_DAYS, DEFAULT_AVATAR } from "../types";

const KEYS = {
  users: "hangout_users",
  session: "hangout_session",
  rooms: "hangout_rooms",
  calendar: "hangout_calendar",
  calendarEvents: "hangout_calendar_events",
  calendarConnections: "hangout_calendar_connections",
  polls: "hangout_polls",
  suggestions: "hangout_suggestions",
  notifications: "hangout_notifications",
  messages: "hangout_messages",
  nicknames: "hangout_room_nicknames",
  nicknameRequests: "hangout_nickname_requests",
  personalAccess: "hangout_personal_access",
  suggestionCategories: "hangout_suggestion_categories",
} as const;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getUsers(): User[] {
  return migrateUsers(read<User[]>(KEYS.users, []));
}

function migrateUsers(users: User[]): User[] {
  return users.map((u) => ({
    ...u,
    avatar: {
      ...DEFAULT_AVATAR,
      ...u.avatar,
      accessory: u.avatar?.accessory ?? "none",
      skinTone: u.avatar?.skinTone ?? "#f5d0b5",
    },
  }));
}

export function saveUsers(users: User[]): void {
  write(KEYS.users, users);
}

export function getSessionUserId(): string | null {
  return localStorage.getItem(KEYS.session);
}

export function setSessionUserId(id: string | null): void {
  if (id) localStorage.setItem(KEYS.session, id);
  else localStorage.removeItem(KEYS.session);
}

export function getRooms(): VirtualRoom[] {
  return read<VirtualRoom[]>(KEYS.rooms, []);
}

export function saveRooms(rooms: VirtualRoom[]): void {
  write(KEYS.rooms, rooms);
}

export function getCalendarSlots(): CalendarSlot[] {
  return read<CalendarSlot[]>(KEYS.calendar, []);
}

export function saveCalendarSlots(slots: CalendarSlot[]): void {
  write(KEYS.calendar, slots);
}

export function getCalendarEvents(): CalendarEvent[] {
  return read<CalendarEvent[]>(KEYS.calendarEvents, []).map((e) => ({
    ...e,
    status: e.status ?? "confirmed",
    rsvpUserIds: e.rsvpUserIds ?? [],
    syncedToGoogleUserIds: e.syncedToGoogleUserIds ?? [],
    syncedToAppleUserIds: e.syncedToAppleUserIds ?? [],
  }));
}

export function saveCalendarEvents(events: CalendarEvent[]): void {
  write(KEYS.calendarEvents, events);
}

export function getSuggestionCategoriesByRoom(): Record<string, string[]> {
  return read<Record<string, string[]>>(KEYS.suggestionCategories, {});
}

export function saveSuggestionCategoriesByRoom(
  categoriesByRoom: Record<string, string[]>
): void {
  write(KEYS.suggestionCategories, categoriesByRoom);
}

export function getCalendarConnections(): CalendarConnection[] {
  return read<CalendarConnection[]>(KEYS.calendarConnections, []);
}

export function saveCalendarConnections(connections: CalendarConnection[]): void {
  write(KEYS.calendarConnections, connections);
}

export function getPolls(): Poll[] {
  return read<Poll[]>(KEYS.polls, []);
}

export function savePolls(polls: Poll[]): void {
  write(KEYS.polls, polls);
}

export function getSuggestions(): Suggestion[] {
  return migrateSuggestions(read<Suggestion[]>(KEYS.suggestions, []));
}

function migrateSuggestions(items: Suggestion[]): Suggestion[] {
  const now = new Date().toISOString();
  const archiveMs = ARCHIVE_DAYS * 24 * 60 * 60 * 1000;
  return items.map((s) => {
    const createdAt = s.createdAt ?? now;
    const age = Date.now() - new Date(createdAt).getTime();
    const shouldArchive =
      !s.archived && s.likes.length === 0 && age >= archiveMs;
    return {
      ...s,
      createdAt,
      archived: s.archived || shouldArchive,
    };
  });
}

export function saveSuggestions(suggestions: Suggestion[]): void {
  const migrated = migrateSuggestions(suggestions);
  write(KEYS.suggestions, migrated);
}

export function getNotifications(): Notification[] {
  return read<Notification[]>(KEYS.notifications, []);
}

export function saveNotifications(notifications: Notification[]): void {
  write(KEYS.notifications, notifications);
}

export function getMessages(): RoomMessage[] {
  return read<RoomMessage[]>(KEYS.messages, []);
}

export function saveMessages(messages: RoomMessage[]): void {
  write(KEYS.messages, messages);
}

export function getRoomNicknames(): RoomNickname[] {
  return read<RoomNickname[]>(KEYS.nicknames, []);
}

export function saveRoomNicknames(nicknames: RoomNickname[]): void {
  write(KEYS.nicknames, nicknames);
}

export function getNicknameRequests(): NicknameRequest[] {
  return read<NicknameRequest[]>(KEYS.nicknameRequests, []);
}

export function saveNicknameRequests(requests: NicknameRequest[]): void {
  write(KEYS.nicknameRequests, requests);
}

export function getPersonalRoomAccess(): PersonalRoomAccess[] {
  return read<PersonalRoomAccess[]>(KEYS.personalAccess, []);
}

export function savePersonalRoomAccess(access: PersonalRoomAccess[]): void {
  write(KEYS.personalAccess, access);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Stable demo friend IDs so they persist across sessions */
export const DEMO_FRIEND_IDS = {
  alex: "demo-friend-alex",
  sam: "demo-friend-sam",
  jordan: "demo-friend-jordan",
} as const;

export function linkExistingDemoFriends(currentUserId: string): void {
  const users = read<User[]>(KEYS.users, []);
  const demos = users.filter((u) => u.email.endsWith("@demo.com"));
  if (demos.length === 0) return;
  const current = users.find((u) => u.id === currentUserId);
  if (!current) return;
  const demoIds = demos.map((d) => d.id);
  const needsUpdate = demoIds.some((id) => !current.friendIds.includes(id));
  if (!needsUpdate) return;
  const updatedCurrent: User = {
    ...current,
    friendIds: [...new Set([...current.friendIds, ...demoIds])],
  };
  saveUsers(
    users.map((u) => (u.id === currentUserId ? updatedCurrent : u))
  );
}

export function seedDemoFriends(currentUserId: string): void {
  const users = getUsers();
  if (users.some((u) => u.id === DEMO_FRIEND_IDS.alex)) {
    linkExistingDemoFriends(currentUserId);
    return;
  }
  if (users.some((u) => u.email === "alex@demo.com")) {
    linkExistingDemoFriends(currentUserId);
    return;
  }

  const demoUsers: User[] = [
    {
      id: DEMO_FRIEND_IDS.alex,
      email: "alex@demo.com",
      password: "demo123",
      displayName: "Alex",
      avatar: {
        hairstyle: "short",
        hairColor: "#2c1810",
        shirtStyle: "hoodie",
        shirtColor: "#e07a5f",
        bottomStyle: "pants",
        bottomColor: "#1d3557",
        shoes: "sneakers",
        accessory: "headphones",
        skinTone: "#e8c4a8",
      },
      friendIds: [currentUserId, DEMO_FRIEND_IDS.sam, DEMO_FRIEND_IDS.jordan],
      online: true,
      avatarCustomized: true,
    },
    {
      id: DEMO_FRIEND_IDS.sam,
      email: "sam@demo.com",
      password: "demo123",
      displayName: "Sam",
      avatar: {
        hairstyle: "curly",
        hairColor: "#8b5a2b",
        shirtStyle: "sweater",
        shirtColor: "#81b29a",
        bottomStyle: "skirt",
        bottomColor: "#f4a261",
        shoes: "boots",
        accessory: "glasses",
        skinTone: "#d4a574",
      },
      friendIds: [currentUserId, DEMO_FRIEND_IDS.alex, DEMO_FRIEND_IDS.jordan],
      online: true,
      avatarCustomized: true,
    },
    {
      id: DEMO_FRIEND_IDS.jordan,
      email: "jordan@demo.com",
      password: "demo123",
      displayName: "Jordan",
      avatar: {
        hairstyle: "bun",
        hairColor: "#1a1a2e",
        shirtStyle: "jacket",
        shirtColor: "#9b5de5",
        bottomStyle: "pants",
        bottomColor: "#264653",
        shoes: "sneakers",
        accessory: "hat",
        skinTone: "#c68642",
      },
      friendIds: [currentUserId, DEMO_FRIEND_IDS.alex, DEMO_FRIEND_IDS.sam],
      online: true,
      avatarCustomized: true,
    },
  ];

  const current = users.find((u) => u.id === currentUserId);
  if (!current) return;

  const updatedCurrent: User = {
    ...current,
    friendIds: [
      ...new Set([
        ...current.friendIds,
        DEMO_FRIEND_IDS.alex,
        DEMO_FRIEND_IDS.sam,
        DEMO_FRIEND_IDS.jordan,
      ]),
    ],
  };

  saveUsers([
    ...users.filter((u) => u.id !== currentUserId),
    updatedCurrent,
    ...demoUsers,
  ]);
}

export function ensurePersonalRoomsForRoom(room: VirtualRoom): PersonalRoomAccess[] {
  const all = getPersonalRoomAccess();
  const existing = all.filter((a) => a.roomId === room.id);
  const missing = room.memberIds.filter(
    (id) => !existing.some((e) => e.ownerId === id)
  );
  if (missing.length === 0) return all;

  const added: PersonalRoomAccess[] = missing.map((ownerId) => ({
    roomId: room.id,
    ownerId,
    grantedIds: [ownerId],
    pendingRequests: [],
  }));

  const next = [...all, ...added];
  savePersonalRoomAccess(next);
  return next;
}
