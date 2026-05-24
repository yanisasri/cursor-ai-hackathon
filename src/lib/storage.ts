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

/** Stable demo friend emails so they persist across sessions */
export const DEMO_FRIEND_IDS = {
  alex: "alex@demo.com",
  sam: "sam@demo.com",
  jordan: "jordan@demo.com",
} as const;

export async function linkExistingDemoFriends(currentUserId: string): Promise<void> {
  const users = await getUsers();
  const demos = users.filter((u) => u.email.endsWith("@demo.com"));
  const current = users.find((u) => u.id === currentUserId);
  if (!current || demos.length === 0) return;
  const merged = [...new Set([...current.friendIds, ...demos.map((d) => d.id)])];
  await saveUsers(users.map((u) => (u.id === currentUserId ? { ...u, friendIds: merged } : u)));
}

export async function seedDemoFriends(currentUserId: string): Promise<void> {
  const users = await getUsers();
  const current = users.find((u) => u.id === currentUserId);
  if (!current) return;

  const demoSeed: Array<Omit<User, "id" | "friendIds"> & { email: string }> = [
    {
      email: DEMO_FRIEND_IDS.alex,
      password: await sha256("demo123"),
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
      online: true,
      avatarCustomized: true,
    },
    {
      email: DEMO_FRIEND_IDS.sam,
      password: await sha256("demo123"),
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
      online: true,
      avatarCustomized: true,
    },
    {
      email: DEMO_FRIEND_IDS.jordan,
      password: await sha256("demo123"),
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
      online: true,
      avatarCustomized: true,
    },
  ];

  const byEmail = new Map(users.map((u) => [u.email, u]));
  const next = [...users];
  for (const seed of demoSeed) {
    if (byEmail.has(seed.email)) continue;
    next.push({
      id: generateId(),
      email: seed.email,
      password: seed.password,
      displayName: seed.displayName,
      avatar: seed.avatar,
      friendIds: [],
      online: seed.online,
      avatarCustomized: seed.avatarCustomized,
    });
  }

  const demoIds = next.filter((u) => u.email.endsWith("@demo.com")).map((u) => u.id);
  const withFriendGraph = next.map((u) => {
    if (u.id === currentUserId) {
      return { ...u, friendIds: [...new Set([...u.friendIds, ...demoIds])] };
    }
    if (demoIds.includes(u.id)) {
      return {
        ...u,
        friendIds: [...new Set([...u.friendIds, currentUserId, ...demoIds.filter((id) => id !== u.id)])],
      };
    }
    return u;
  });
  await saveUsers(withFriendGraph);
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
    if (message.toLowerCase().includes("duplicate")) {
      return { ok: false, error: "An account with this email already exists." };
    }
    return { ok: false, error: message };
  }
  return { ok: true, user: newUser };
}
