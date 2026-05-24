export interface AvatarConfig {
  /** Stable DiceBear seed — set once so edits do not reshuffle the face. */
  seed?: string;
  skinTone: string;
  hairColor: string;
  eyesColor: string;
  mouthColor: string;
  /** Lorelei hair variant 1–48 */
  hairIndex: number;
  /** Lorelei eyes variant 1–24 */
  eyesIndex: number;
  /** Lorelei eyebrows variant 1–13 */
  eyebrowsIndex: number;
  /** Index into LORELEI_MOUTHS */
  mouthIndex: number;
  /** 0 = none, 1–5 = glasses variant */
  glassesIndex: number;
  /** 0 = none, 1–3 = earrings variant */
  earringsIndex: number;
  freckles: boolean;
}

export const LORELEI_MOUTHS = [
  "happy01",
  "happy02",
  "happy03",
  "happy04",
  "happy05",
  "happy06",
  "happy07",
  "happy08",
  "happy09",
  "happy10",
  "happy11",
  "happy12",
  "happy13",
  "happy14",
  "happy15",
  "happy16",
  "happy17",
  "happy18",
] as const;

export const AVATAR_LIMITS = {
  hair: 48,
  eyes: 24,
  eyebrows: 13,
  glasses: 5,
  earrings: 3,
} as const;

export type UserPresence = "online" | "idle" | "offline";

export interface User {
  id: string;
  email: string;
  password: string;
  displayName: string;
  avatar: AvatarConfig;
  friendIds: string[];
  /** @deprecated use presence — kept for compatibility */
  online: boolean;
  presence: UserPresence;
  avatarCustomized?: boolean;
}

export interface FriendRequest {
  userId: string;
  friendId: string;
  requestedBy: string;
  status: "pending";
  createdAt: string;
}

export interface RoomInvite {
  id: string;
  roomId: string;
  fromUserId: string;
  toUserId: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
}

export interface RoomNameChangeRequest {
  id: string;
  roomId: string;
  proposedName: string;
  proposedByUserId: string;
  status: "pending" | "approved" | "declined";
  memberApprovals: Record<string, "pending" | "approved" | "declined">;
  createdAt: string;
}

export function presenceLabel(presence: UserPresence): string {
  switch (presence) {
    case "online":
      return "Online";
    case "idle":
      return "Idle";
    default:
      return "Offline";
  }
}

export function presenceDotClass(presence: UserPresence): string {
  switch (presence) {
    case "online":
      return "bg-green-500";
    case "idle":
      return "bg-amber-400";
    default:
      return "bg-cozy-300";
  }
}

export type RoomArea = "house" | "office" | "cafe" | "park";

export type SubRoomType =
  | "living"
  | "calendar"
  | "decision"
  | "suggestions"
  | "personal";

export interface VirtualRoom {
  id: string;
  name: string;
  area: RoomArea;
  maxMembers: number;
  memberIds: string[];
  ownerId: string;
  createdAt: string;
}

export interface RoomNickname {
  roomId: string;
  userId: string;
  nickname: string;
}

export interface NicknameRequest {
  id: string;
  roomId: string;
  fromUserId: string;
  toUserId: string;
  suggestedNickname: string;
  status: "pending" | "accepted" | "declined";
}

export interface PersonalRoomAccess {
  roomId: string;
  ownerId: string;
  grantedIds: string[];
  pendingRequests: { userId: string; requestedAt: string }[];
}

/** Owner + one guest max inside a personal room */
export const PERSONAL_ROOM_MAX_OCCUPANCY = 2;

export function getPersonalRoomGuests(access: PersonalRoomAccess): string[] {
  return access.grantedIds.filter((id) => id !== access.ownerId);
}

export function isPersonalRoomFull(access: PersonalRoomAccess): boolean {
  return getPersonalRoomGuests(access).length >= PERSONAL_ROOM_MAX_OCCUPANCY - 1;
}

/** @deprecated use CalendarEvent */
export interface CalendarSlot {
  id: string;
  userId: string;
  label: string;
  day: string;
  startHour: number;
  endHour: number;
  free: boolean;
}

export interface CalendarEvent {
  id: string;
  roomId: string;
  userId: string;
  title: string;
  location: string;
  startAt: string;
  endAt: string;
  source: "manual" | "google" | "apple";
  status?: "pending" | "confirmed";
  rsvpUserIds?: string[];
  syncedToGoogleUserIds?: string[];
  syncedToAppleUserIds?: string[];
}

export interface CalendarConnection {
  userId: string;
  googleConnected: boolean;
  appleConnected: boolean;
}

export type SuggestionCategory = string;

export interface Suggestion {
  id: string;
  roomId: string;
  title: string;
  category: SuggestionCategory;
  addedBy: string;
  likes: string[];
  link?: string;
  imageUrl?: string;
  createdAt: string;
  archived?: boolean;
}

export interface RoomDecisionOptions {
  roomId: string;
  title: string;
  options: string[];
  updatedBy: string;
  updatedAt: string;
}

export function parseDecisionOptionsInput(text: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const line of text.split("\n")) {
    for (const part of line.split(",")) {
      const trimmed = part.trim();
      const key = trimmed.toLowerCase();
      if (!trimmed || seen.has(key)) continue;
      seen.add(key);
      result.push(trimmed);
    }
  }
  return result;
}

export function formatDecisionOptionsForInput(options: string[]): string {
  return options.join("\n");
}

export interface SuggestionCategoryOption {
  id: SuggestionCategory;
  label: string;
  emoji: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[];
}

export interface Poll {
  id: string;
  roomId: string;
  question: string;
  options: PollOption[];
  createdBy: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: "hangout" | "calendar" | "decision" | "friend" | "room";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface RoomMessage {
  id: string;
  roomId: string;
  userId: string;
  text: string;
  createdAt: string;
}

export const DEFAULT_AVATAR: AvatarConfig = {
  seed: "default-avatar",
  skinTone: "#f5d0b5",
  hairColor: "#4a3728",
  eyesColor: "#000000",
  mouthColor: "#000000",
  hairIndex: 14,
  eyesIndex: 1,
  eyebrowsIndex: 1,
  mouthIndex: 0,
  glassesIndex: 0,
  earringsIndex: 0,
  freckles: false,
};

export function getDisplayAvatar(user: User): AvatarConfig {
  return user.avatar ?? DEFAULT_AVATAR;
}

export const ROOM_AREAS: { id: RoomArea; label: string; emoji: string }[] = [
  { id: "house", label: "Cozy House", emoji: "🏠" },
  { id: "office", label: "Study Office", emoji: "💼" },
  { id: "cafe", label: "Corner Café", emoji: "☕" },
  { id: "park", label: "Evening Park", emoji: "🌳" },
];

export const SUB_ROOMS: { id: SubRoomType; label: string; description: string }[] = [
  { id: "living", label: "Living / Meeting Room", description: "Voice chat & casual hangouts" },
  { id: "calendar", label: "Calendar Room", description: "See when everyone is free" },
  { id: "decision", label: "Decision Room", description: "Polls, wheel, tier list & swipe" },
  { id: "suggestions", label: "Suggestions Room", description: "Share activities & restaurants" },
  { id: "personal", label: "Personal Rooms", description: "Each member has their own private space" },
];

export const SUGGESTION_CATEGORIES: SuggestionCategoryOption[] = [
  { id: "restaurant", label: "Restaurants", emoji: "🍽️" },
  { id: "movie", label: "Movies", emoji: "🎬" },
  { id: "activity", label: "Activities", emoji: "🎯" },
  { id: "game", label: "Games", emoji: "🎮" },
  { id: "other", label: "Other", emoji: "✨" },
];

export const MAX_ROOM_MEMBERS = 8;
export const ARCHIVE_DAYS = 21;
