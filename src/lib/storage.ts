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
  },
  {
    id: DEMO_FRIEND_IDS.sam,
    email: "sam@demo.com",
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
  },
  {
    id: DEMO_FRIEND_IDS.jordan,
    email: "jordan@demo.com",
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
  },
  {
    id: DEMO_FRIEND_IDS.casey,
    email: "casey@demo.com",
    displayName: "Casey",
    avatar: {
      hairstyle: "medium",
      hairColor: "#5c4033",
      shirtStyle: "tee",
      shirtColor: "#457b9d",
      bottomStyle: "shorts",
      bottomColor: "#f1faee",
      shoes: "sandals",
      accessory: "none",
      skinTone: "#f5d0b5",
    },
  },
  {
    id: DEMO_FRIEND_IDS.morgan,
    email: "morgan@demo.com",
    displayName: "Morgan",
    avatar: {
      hairstyle: "ponytail",
      hairColor: "#6a040f",
      shirtStyle: "polo",
      shirtColor: "#ffb703",
      bottomStyle: "pants",
      bottomColor: "#023047",
      shoes: "loafers",
      accessory: "glasses",
      skinTone: "#d4a574",
    },
  },
  {
    id: DEMO_FRIEND_IDS.riley,
    email: "riley@demo.com",
    displayName: "Riley",
    avatar: {
      hairstyle: "bangs",
      hairColor: "#3d005b",
      shirtStyle: "tank",
      shirtColor: "#06d6a0",
      bottomStyle: "skirt",
      bottomColor: "#118ab2",
      shoes: "heels",
      accessory: "none",
      skinTone: "#e8c4a8",
    },
  },
  {
    id: DEMO_FRIEND_IDS.taylor,
    email: "taylor@demo.com",
    displayName: "Taylor",
    avatar: {
      hairstyle: "long",
      hairColor: "#4a3728",
      shirtStyle: "blazer",
      shirtColor: "#7209b7",
      bottomStyle: "dress",
      bottomColor: "#560bad",
      shoes: "boots",
      accessory: "hat",
      skinTone: "#c68642",
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
