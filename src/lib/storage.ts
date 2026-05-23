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
import { ARCHIVE_DAYS, DEFAULT_AVATAR, type AvatarConfig } from "../types";

/** Migrate legacy avatar fields (pre-Lorelei) into the new shape. */
function migrateAvatar(raw: Partial<AvatarConfig> & Record<string, unknown>): AvatarConfig {
  if (typeof raw.hairIndex === "number") {
    const merged = { ...DEFAULT_AVATAR, ...raw };
    return {
      ...merged,
      seed:
        typeof raw.seed === "string"
          ? raw.seed
          : `av-${merged.hairIndex}-${merged.eyesIndex}-${merged.mouthIndex}`,
    };
  }

  const legacyHair: Record<string, number> = {
    short: 4,
    medium: 14,
    long: 32,
    curly: 22,
    bun: 38,
    ponytail: 28,
    bangs: 8,
  };

  const hairstyle = String(raw.hairstyle ?? "medium");
  const accessory = String(raw.accessory ?? "none");

  return {
    seed: `legacy-${legacyHair[hairstyle] ?? DEFAULT_AVATAR.hairIndex}-e${typeof raw.eyesIndex === "number" ? raw.eyesIndex : DEFAULT_AVATAR.eyesIndex}`,
    skinTone: String(raw.skinTone ?? DEFAULT_AVATAR.skinTone),
    hairColor: String(raw.hairColor ?? DEFAULT_AVATAR.hairColor),
    eyesColor: DEFAULT_AVATAR.eyesColor,
    mouthColor: DEFAULT_AVATAR.mouthColor,
    hairIndex: legacyHair[hairstyle] ?? DEFAULT_AVATAR.hairIndex,
    eyesIndex: typeof raw.eyesIndex === "number" ? raw.eyesIndex : DEFAULT_AVATAR.eyesIndex,
    eyebrowsIndex:
      typeof raw.eyebrowsIndex === "number" ? raw.eyebrowsIndex : DEFAULT_AVATAR.eyebrowsIndex,
    mouthIndex: typeof raw.mouthIndex === "number" ? raw.mouthIndex : DEFAULT_AVATAR.mouthIndex,
    glassesIndex: accessory === "glasses" ? 1 : DEFAULT_AVATAR.glassesIndex,
    earringsIndex: DEFAULT_AVATAR.earringsIndex,
    freckles: Boolean(raw.freckles),
  };
}

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
    avatar: migrateAvatar((u.avatar ?? {}) as Partial<AvatarConfig> & Record<string, unknown>),
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
        seed: "demo-alex",
        skinTone: "#e8c4a8",
        hairColor: "#2c1810",
        eyesColor: "#000000",
        mouthColor: "#000000",
        hairIndex: 4,
        eyesIndex: 3,
        eyebrowsIndex: 2,
        mouthIndex: 1,
        glassesIndex: 0,
        earringsIndex: 0,
        freckles: false,
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
        seed: "demo-sam",
        skinTone: "#d4a574",
        hairColor: "#8b5a2b",
        eyesColor: "#000000",
        mouthColor: "#000000",
        hairIndex: 22,
        eyesIndex: 5,
        eyebrowsIndex: 4,
        mouthIndex: 2,
        glassesIndex: 2,
        earringsIndex: 1,
        freckles: true,
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
        seed: "demo-jordan",
        skinTone: "#c68642",
        hairColor: "#1a1a2e",
        eyesColor: "#000000",
        mouthColor: "#000000",
        hairIndex: 38,
        eyesIndex: 8,
        eyebrowsIndex: 6,
        mouthIndex: 4,
        glassesIndex: 0,
        earringsIndex: 2,
        freckles: false,
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
