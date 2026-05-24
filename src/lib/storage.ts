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
import { DEBUG_CONFIG } from "../config/supabase";
import { supabaseApi } from "./supabaseApi";

const KEYS = {
  session: "hangout_session",
  calendar: "hangout_calendar",
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

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getSessionUserId(): string | null {
  return localStorage.getItem(KEYS.session);
}

export function setSessionUserId(id: string | null): void {
  if (id) localStorage.setItem(KEYS.session, id);
  else localStorage.removeItem(KEYS.session);
}

export async function getUsers(): Promise<User[]> {
  return supabaseApi.getUsers();
}

export async function saveUsers(users: User[]): Promise<void> {
  await supabaseApi.saveUsers(users);
}

export async function getRooms(): Promise<VirtualRoom[]> {
  return supabaseApi.getRooms();
}

export async function saveRooms(rooms: VirtualRoom[]): Promise<void> {
  await supabaseApi.saveRooms(rooms);
}

export async function createRoomRecord(room: VirtualRoom): Promise<void> {
  await supabaseApi.createRoom(room);
}

export function getCalendarSlots(): CalendarSlot[] {
  return read<CalendarSlot[]>(KEYS.calendar, []);
}

export function saveCalendarSlots(slots: CalendarSlot[]): void {
  write(KEYS.calendar, slots);
}

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  return supabaseApi.getCalendarEvents();
}

export async function saveCalendarEvents(events: CalendarEvent[]): Promise<void> {
  await supabaseApi.saveCalendarEvents(events);
}

export async function getSuggestionCategoriesByRoom(): Promise<Record<string, string[]>> {
  return supabaseApi.getSuggestionCategoriesByRoom();
}

export async function saveSuggestionCategoriesByRoom(
  categoriesByRoom: Record<string, string[]>
): Promise<void> {
  await supabaseApi.saveSuggestionCategoriesByRoom(categoriesByRoom);
}

export async function getCalendarConnections(): Promise<CalendarConnection[]> {
  return supabaseApi.getCalendarConnections();
}

export async function saveCalendarConnections(connections: CalendarConnection[]): Promise<void> {
  await supabaseApi.saveCalendarConnections(connections);
}

export async function getPolls(): Promise<Poll[]> {
  return supabaseApi.getPolls();
}

export async function savePolls(polls: Poll[]): Promise<void> {
  await supabaseApi.savePolls(polls);
}

function migrateSuggestions(items: Suggestion[]): Suggestion[] {
  const now = new Date().toISOString();
  const archiveMs = ARCHIVE_DAYS * 24 * 60 * 60 * 1000;
  return items.map((s) => {
    const createdAt = s.createdAt ?? now;
    const age = Date.now() - new Date(createdAt).getTime();
    const shouldArchive = !s.archived && s.likes.length === 0 && age >= archiveMs;
    return {
      ...s,
      createdAt,
      archived: s.archived || shouldArchive,
    };
  });
}

export async function getSuggestions(): Promise<Suggestion[]> {
  return migrateSuggestions(await supabaseApi.getSuggestions());
}

export async function saveSuggestions(suggestions: Suggestion[]): Promise<void> {
  await supabaseApi.saveSuggestions(migrateSuggestions(suggestions));
}

export async function getNotifications(): Promise<Notification[]> {
  return supabaseApi.getNotifications();
}

export async function saveNotifications(notifications: Notification[]): Promise<void> {
  await supabaseApi.saveNotifications(notifications);
}

export async function getMessages(): Promise<RoomMessage[]> {
  return supabaseApi.getMessages();
}

export async function saveMessages(messages: RoomMessage[]): Promise<void> {
  await supabaseApi.saveMessages(messages);
}

export async function getRoomNicknames(): Promise<RoomNickname[]> {
  return supabaseApi.getRoomNicknames();
}

export async function saveRoomNicknames(nicknames: RoomNickname[]): Promise<void> {
  await supabaseApi.saveRoomNicknames(nicknames);
}

export async function getNicknameRequests(): Promise<NicknameRequest[]> {
  return supabaseApi.getNicknameRequests();
}

export async function saveNicknameRequests(requests: NicknameRequest[]): Promise<void> {
  await supabaseApi.saveNicknameRequests(requests);
}

export async function getPersonalRoomAccess(): Promise<PersonalRoomAccess[]> {
  return supabaseApi.getPersonalRoomAccess();
}

export async function savePersonalRoomAccess(access: PersonalRoomAccess[]): Promise<void> {
  await supabaseApi.savePersonalRoomAccess(access);
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

function buildDemoUser(profile: DemoProfile, currentUserId: string, passwordHash: string): User {
  return {
    id: profile.id,
    email: profile.email,
    password: passwordHash,
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
export async function ensureDemoFriends(currentUserId: string): Promise<void> {
  let users = await getUsers();
  const current = users.find((u) => u.id === currentUserId);
  if (!current) return;
  const passwordHash = await sha256("demo123");

  for (const profile of DEMO_PROFILES) {
    if (!users.some((u) => u.id === profile.id)) {
      users = [...users, buildDemoUser(profile, currentUserId, passwordHash)];
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

  await saveUsers(users);
}

export async function linkExistingDemoFriends(currentUserId: string): Promise<void> {
  await ensureDemoFriends(currentUserId);
}

export async function seedDemoFriends(currentUserId: string): Promise<void> {
  await ensureDemoFriends(currentUserId);
}

export async function ensurePersonalRoomsForRoom(room: VirtualRoom): Promise<PersonalRoomAccess[]> {
  const all = await getPersonalRoomAccess();
  const existing = all.filter((a) => a.roomId === room.id);
  const missing = room.memberIds.filter((id) => !existing.some((e) => e.ownerId === id));
  if (missing.length === 0) return all;
  const next = [
    ...all,
    ...missing.map((ownerId) => ({
      roomId: room.id,
      ownerId,
      grantedIds: [ownerId],
      pendingRequests: [],
    })),
  ];
  await savePersonalRoomAccess(next);
  return next;
}

export async function verifyCredentials(email: string, password: string): Promise<User | null> {
  const hashed = await sha256(password);
  return supabaseApi.getUserByCredentials(email, hashed);
}

export async function createUser(
  email: string,
  password: string
): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || password.length < 6) {
    return { ok: false, error: "Email required and password must be at least 6 characters." };
  }
  const users = await getUsers();
  if (users.some((u) => u.email === normalized)) {
    return { ok: false, error: "An account with this email already exists." };
  }
  const passwordHash = await sha256(password);
  const newUser: User = {
    id: generateId(),
    email: normalized,
    password: passwordHash,
    displayName: normalized.split("@")[0],
    avatar: { ...DEFAULT_AVATAR },
    friendIds: [],
    online: true,
    avatarCustomized: false,
  };
  try {
    await supabaseApi.createAccount({
      id: newUser.id,
      email: newUser.email,
      passwordHash,
      displayName: newUser.displayName,
      avatar: newUser.avatar,
      avatarCustomized: newUser.avatarCustomized ?? false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create account.";
    // #region agent log
    fetch(DEBUG_CONFIG.endpoint,{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':DEBUG_CONFIG.sessionId},body:JSON.stringify({sessionId:DEBUG_CONFIG.sessionId,runId:'pre-fix',hypothesisId:'H4',location:'src/lib/storage.ts:createUser',message:'createUser caught createAccount failure',data:{normalizedEmail:normalized,errorMessage:message},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    if (message.toLowerCase().includes("duplicate")) {
      return { ok: false, error: "An account with this email already exists." };
    }
    return { ok: false, error: message };
  }
  return { ok: true, user: newUser };
}
