import type {
  CalendarConnection,
  CalendarEvent,
  CalendarSlot,
  FriendRequest,
  MailboxNote,
  NicknameRequest,
  Notification,
  PersonalRoomAccess,
  Poll,
  RoomDecisionOptions,
  RoomInvite,
  RoomMessage,
  RoomNameChangeRequest,
  RoomNickname,
  Suggestion,
  User,
  UserPresence,
  VirtualRoom,
} from "../types";
import { ARCHIVE_DAYS, DEFAULT_AVATAR } from "../types";
import { createAvatarSeed } from "./generateAvatar";
import { supabaseApi } from "./supabaseApi";

const KEYS = {
  session: "hangout_session",
  calendar: "hangout_calendar",
  decisionOptions: "hangout_decision_options",
  mailboxNotes: "hangout_mailbox_notes",
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

export async function setUserOnline(userId: string, isOnline: boolean): Promise<void> {
  await supabaseApi.setUserPresence(userId, isOnline ? "online" : "offline");
}

export async function setUserPresence(userId: string, presence: UserPresence): Promise<void> {
  await supabaseApi.setUserPresence(userId, presence);
}

export async function getFriendRequests(): Promise<FriendRequest[]> {
  try {
    return await supabaseApi.getFriendRequests();
  } catch {
    return [];
  }
}

export async function createFriendRequest(fromUserId: string, toUserId: string): Promise<void> {
  await supabaseApi.createFriendRequest(fromUserId, toUserId);
}

export async function respondFriendRequest(
  userId: string,
  otherUserId: string,
  accept: boolean
): Promise<void> {
  await supabaseApi.respondFriendRequest(userId, otherUserId, accept);
}

export async function getRoomInvites(): Promise<RoomInvite[]> {
  try {
    return await supabaseApi.getRoomInvites();
  } catch {
    return [];
  }
}

export async function createRoomInvite(
  roomId: string,
  fromUserId: string,
  toUserId: string
): Promise<void> {
  await supabaseApi.createRoomInvite(roomId, fromUserId, toUserId);
}

export async function respondRoomInvite(
  inviteId: string,
  userId: string,
  accept: boolean
): Promise<void> {
  await supabaseApi.respondRoomInvite(inviteId, userId, accept);
}

export async function getRoomNameChangeRequests(): Promise<RoomNameChangeRequest[]> {
  try {
    return await supabaseApi.getRoomNameChangeRequests();
  } catch {
    return [];
  }
}

export async function proposeRoomNameChange(
  roomId: string,
  proposedByUserId: string,
  proposedName: string
): Promise<string> {
  return supabaseApi.proposeRoomNameChange(roomId, proposedByUserId, proposedName);
}

export async function respondRoomNameChange(
  requestId: string,
  userId: string,
  approve: boolean
): Promise<{ applied: boolean; roomId: string }> {
  return supabaseApi.respondRoomNameChange(requestId, userId, approve);
}

export async function upsertUserAvatars(users: User[]): Promise<void> {
  await supabaseApi.upsertUserAvatars(users);
}

export async function removeFriendship(userId: string, friendId: string): Promise<void> {
  await supabaseApi.removeFriendship(userId, friendId);
}

export async function deleteAccount(userId: string): Promise<void> {
  await supabaseApi.deleteAccount(userId);
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

export async function leaveRoom(roomId: string, userId: string): Promise<void> {
  await supabaseApi.leaveRoom(roomId, userId);
  const rooms = await getRooms();
  if (!rooms.some((r) => r.id === roomId)) {
    removeLocalDecisionOptionsForRoom(roomId);
  }
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
  const accessKey = (a: { roomId: string; ownerId: string }) => `${a.roomId}:${a.ownerId}`;

  let latest: PersonalRoomAccess[] = [];
  try {
    latest = await supabaseApi.getPersonalRoomAccess();
  } catch {
    latest = [];
  }

  const latestMap = new Map(latest.map((a) => [accessKey(a), a]));
  const incomingKeys = new Set(access.map((a) => accessKey(a)));

  const merged: PersonalRoomAccess[] = access.map((inc) => {
    const lat = latestMap.get(accessKey(inc));
    if (!lat) return inc;

    const pendingByUser = new Map<string, { userId: string; requestedAt: string }>();
    for (const req of lat.pendingRequests) {
      pendingByUser.set(req.userId, req);
    }
    for (const req of inc.pendingRequests) {
      pendingByUser.set(req.userId, req);
    }
    for (const userId of inc.grantedIds) {
      if (!lat.grantedIds.includes(userId)) {
        pendingByUser.delete(userId);
      }
    }

    const latUserIds = new Set(lat.pendingRequests.map((r) => r.userId));
    const incUserIds = new Set(inc.pendingRequests.map((r) => r.userId));
    const pendingSubsetRemoval =
      lat.pendingRequests.length > inc.pendingRequests.length &&
      [...incUserIds].every((id) => latUserIds.has(id)) &&
      inc.grantedIds.length === lat.grantedIds.length;

    return {
      ...inc,
      grantedIds: [...new Set([inc.ownerId, ...inc.grantedIds])],
      pendingRequests: pendingSubsetRemoval
        ? inc.pendingRequests
        : [...pendingByUser.values()],
    };
  });

  for (const lat of latest) {
    if (!incomingKeys.has(accessKey(lat))) {
      merged.push(lat);
    }
  }

  await supabaseApi.savePersonalRoomAccess(merged);
}

export async function addPersonalRoomPendingRequest(
  roomId: string,
  ownerId: string,
  requesterUserId: string,
  requestedAt: string
): Promise<void> {
  try {
    await supabaseApi.upsertPersonalRoomPendingRequest(
      roomId,
      ownerId,
      requesterUserId,
      requestedAt
    );
  } catch {
    const all = await getPersonalRoomAccess();
    const idx = all.findIndex((a) => a.roomId === roomId && a.ownerId === ownerId);
    if (idx < 0) return;
    const entry = all[idx];
    if (entry.pendingRequests.some((r) => r.userId === requesterUserId)) return;
    const updated = [...all];
    updated[idx] = {
      ...entry,
      pendingRequests: [...entry.pendingRequests, { userId: requesterUserId, requestedAt }],
    };
    await savePersonalRoomAccess(updated);
  }
}

export async function removePersonalRoomPendingRequest(
  roomId: string,
  ownerId: string,
  requesterUserId: string
): Promise<void> {
  try {
    await supabaseApi.deletePersonalRoomPendingRequest(roomId, ownerId, requesterUserId);
  } catch {
    const all = await getPersonalRoomAccess();
    const idx = all.findIndex((a) => a.roomId === roomId && a.ownerId === ownerId);
    if (idx < 0) return;
    const entry = all[idx];
    const updated = [...all];
    updated[idx] = {
      ...entry,
      pendingRequests: entry.pendingRequests.filter((r) => r.userId !== requesterUserId),
    };
    await savePersonalRoomAccess(updated);
  }
}

export async function grantPersonalRoomAccessEntry(
  roomId: string,
  ownerId: string,
  grantUserId: string
): Promise<void> {
  try {
    await supabaseApi.deletePersonalRoomPendingRequest(roomId, ownerId, grantUserId);
    await supabaseApi.insertPersonalRoomGranted(roomId, ownerId, grantUserId);
  } catch {
    const all = await getPersonalRoomAccess();
    const idx = all.findIndex((a) => a.roomId === roomId && a.ownerId === ownerId);
    if (idx < 0) return;
    const entry = all[idx];
    const updated = [...all];
    updated[idx] = {
      ...entry,
      grantedIds: [...new Set([...entry.grantedIds, grantUserId])],
      pendingRequests: entry.pendingRequests.filter((r) => r.userId !== grantUserId),
    };
    await savePersonalRoomAccess(updated);
  }
}

export async function revokePersonalRoomGuest(
  roomId: string,
  ownerId: string,
  guestUserId: string
): Promise<void> {
  try {
    await supabaseApi.removePersonalRoomGranted(roomId, ownerId, guestUserId);
  } catch {
    const all = await getPersonalRoomAccess();
    const idx = all.findIndex((a) => a.roomId === roomId && a.ownerId === ownerId);
    if (idx < 0) return;
    const entry = all[idx];
    const updated = [...all];
    updated[idx] = {
      ...entry,
      grantedIds: entry.grantedIds.filter((id) => id !== guestUserId),
    };
    await savePersonalRoomAccess(updated);
  }
}

export async function refreshPersonalRoomAccessFromDb(): Promise<PersonalRoomAccess[]> {
  return getPersonalRoomAccess();
}

export async function getMailboxNotes(): Promise<MailboxNote[]> {
  try {
    const notes = await supabaseApi.getMailboxNotes();
    write(KEYS.mailboxNotes, notes);
    return notes;
  } catch {
    return read<MailboxNote[]>(KEYS.mailboxNotes, []);
  }
}

export async function appendMailboxNote(note: MailboxNote): Promise<void> {
  const all = await getMailboxNotes();
  const next = [note, ...all];
  write(KEYS.mailboxNotes, next);
  try {
    await supabaseApi.insertMailboxNote(note);
  } catch {
    /* saved locally */
  }
}

export async function updateMailboxNoteRead(noteId: string): Promise<void> {
  const all = await getMailboxNotes();
  const next = all.map((n) => (n.id === noteId ? { ...n, read: true } : n));
  write(KEYS.mailboxNotes, next);
  try {
    await supabaseApi.markMailboxNoteRead(noteId);
  } catch {
    /* local only */
  }
}

function normalizeDecisionEntry(
  roomId: string,
  entry: Partial<RoomDecisionOptions>
): RoomDecisionOptions {
  return {
    roomId,
    title: entry.title ?? "",
    options: Array.isArray(entry.options) ? entry.options : [],
    updatedBy: entry.updatedBy ?? "",
    updatedAt: entry.updatedAt ?? new Date().toISOString(),
  };
}

function readLocalDecisionOptions(): Record<string, RoomDecisionOptions> {
  const raw = read<Record<string, Partial<RoomDecisionOptions>>>(KEYS.decisionOptions, {});
  return Object.fromEntries(
    Object.entries(raw).map(([roomId, entry]) => [roomId, normalizeDecisionEntry(roomId, entry)])
  );
}

function writeLocalDecisionOptions(data: Record<string, RoomDecisionOptions>): void {
  write(KEYS.decisionOptions, data);
}

function removeLocalDecisionOptionsForRoom(roomId: string): void {
  const local = readLocalDecisionOptions();
  if (!(roomId in local)) return;
  const { [roomId]: _removed, ...rest } = local;
  writeLocalDecisionOptions(rest);
}

export async function getDecisionOptionsByRoom(): Promise<Record<string, RoomDecisionOptions>> {
  return readLocalDecisionOptions();
}

export async function saveDecisionOptions(
  roomId: string,
  title: string,
  options: string[],
  userId: string
): Promise<void> {
  const entry: RoomDecisionOptions = {
    roomId,
    title: title.trim(),
    options,
    updatedBy: userId,
    updatedAt: new Date().toISOString(),
  };
  const local = readLocalDecisionOptions();
  writeLocalDecisionOptions({ ...local, [roomId]: entry });
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
    avatar: { ...DEFAULT_AVATAR, seed: createAvatarSeed() },
    friendIds: [],
    online: true,
    presence: "online",
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
