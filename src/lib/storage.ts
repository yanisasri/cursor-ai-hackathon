import type {
  AvatarConfig,
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

/** Stable demo friend IDs so they persist across sessions (7 friends + you = 8 max) */
export const DEMO_FRIEND_IDS = {
  alex: "demo-friend-alex",
  sam: "demo-friend-sam",
  jordan: "demo-friend-jordan",
  casey: "demo-friend-casey",
  morgan: "demo-friend-morgan",
  riley: "demo-friend-riley",
  taylor: "demo-friend-taylor",
} as const;

const ALL_DEMO_IDS = Object.values(DEMO_FRIEND_IDS);

type DemoProfile = {
  id: string;
  email: string;
  displayName: string;
  avatar: AvatarConfig;
};

const DEMO_PROFILES: DemoProfile[] = [
  {
    id: DEMO_FRIEND_IDS.alex,
    email: "alex@demo.com",
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
  },
  {
    id: DEMO_FRIEND_IDS.sam,
    email: "sam@demo.com",
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
  },
  {
    id: DEMO_FRIEND_IDS.jordan,
    email: "jordan@demo.com",
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
  },
  {
    id: DEMO_FRIEND_IDS.casey,
    email: "casey@demo.com",
    displayName: "Casey",
    avatar: {
      seed: "demo-casey",
      skinTone: "#f5d0b5",
      hairColor: "#5c4033",
      eyesColor: "#000000",
      mouthColor: "#000000",
      hairIndex: 14,
      eyesIndex: 2,
      eyebrowsIndex: 1,
      mouthIndex: 0,
      glassesIndex: 0,
      earringsIndex: 0,
      freckles: false,
    },
  },
  {
    id: DEMO_FRIEND_IDS.morgan,
    email: "morgan@demo.com",
    displayName: "Morgan",
    avatar: {
      seed: "demo-morgan",
      skinTone: "#d4a574",
      hairColor: "#6a040f",
      eyesColor: "#000000",
      mouthColor: "#000000",
      hairIndex: 28,
      eyesIndex: 6,
      eyebrowsIndex: 3,
      mouthIndex: 1,
      glassesIndex: 1,
      earringsIndex: 0,
      freckles: false,
    },
  },
  {
    id: DEMO_FRIEND_IDS.riley,
    email: "riley@demo.com",
    displayName: "Riley",
    avatar: {
      seed: "demo-riley",
      skinTone: "#e8c4a8",
      hairColor: "#3d005b",
      eyesColor: "#000000",
      mouthColor: "#000000",
      hairIndex: 8,
      eyesIndex: 4,
      eyebrowsIndex: 2,
      mouthIndex: 3,
      glassesIndex: 0,
      earringsIndex: 1,
      freckles: true,
    },
  },
  {
    id: DEMO_FRIEND_IDS.taylor,
    email: "taylor@demo.com",
    displayName: "Taylor",
    avatar: {
      seed: "demo-taylor",
      skinTone: "#c68642",
      hairColor: "#4a3728",
      eyesColor: "#000000",
      mouthColor: "#000000",
      hairIndex: 32,
      eyesIndex: 7,
      eyebrowsIndex: 5,
      mouthIndex: 2,
      glassesIndex: 0,
      earringsIndex: 0,
      freckles: false,
    },
  },
];

function buildDemoUser(profile: DemoProfile, currentUserId: string): User {
  return {
    id: profile.id,
    email: profile.email,
    password: "demo123",
    displayName: profile.displayName,
    avatar: profile.avatar,
    friendIds: [
      currentUserId,
      ...ALL_DEMO_IDS.filter((id) => id !== profile.id),
    ],
    online: true,
    avatarCustomized: true,
  };
}

/** Create any missing demo users and link them to the current user */
export function ensureDemoFriends(currentUserId: string): void {
  let users = getUsers();
  const current = users.find((u) => u.id === currentUserId);
  if (!current) return;

  for (const profile of DEMO_PROFILES) {
    if (!users.some((u) => u.id === profile.id)) {
      users = [...users, buildDemoUser(profile, currentUserId)];
    }
  }

  users = users.map((u) => {
    if (u.id === currentUserId) {
      return {
        ...u,
        friendIds: [...new Set([...u.friendIds, ...ALL_DEMO_IDS])],
      };
    }
    if (ALL_DEMO_IDS.includes(u.id as (typeof ALL_DEMO_IDS)[number])) {
      return {
        ...u,
        friendIds: [
          ...new Set([
            ...u.friendIds,
            currentUserId,
            ...ALL_DEMO_IDS.filter((id) => id !== u.id),
          ]),
        ],
      };
    }
    return u;
  });

  saveUsers(users);
}

export function linkExistingDemoFriends(currentUserId: string): void {
  ensureDemoFriends(currentUserId);
}

export function seedDemoFriends(currentUserId: string): void {
  ensureDemoFriends(currentUserId);
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
