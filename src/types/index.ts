export type Hairstyle =
  | "short"
  | "medium"
  | "long"
  | "curly"
  | "bun"
  | "ponytail"
  | "bangs";
export type BottomStyle = "pants" | "skirt" | "shorts" | "dress";
export type ShirtStyle =
  | "tee"
  | "hoodie"
  | "sweater"
  | "jacket"
  | "polo"
  | "tank"
  | "blazer";
export type ShoesStyle = "sneakers" | "boots" | "sandals" | "heels" | "loafers";
export type Accessory = "none" | "glasses" | "hat" | "headphones";

export interface AvatarConfig {
  hairstyle: Hairstyle;
  hairColor: string;
  shirtStyle: ShirtStyle;
  shirtColor: string;
  bottomStyle: BottomStyle;
  bottomColor: string;
  shoes: ShoesStyle;
  accessory: Accessory;
  skinTone: string;
}

export interface User {
  id: string;
  email: string;
  password: string;
  displayName: string;
  avatar: AvatarConfig;
  friendIds: string[];
  online: boolean;
  avatarCustomized?: boolean;
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
  type: "hangout" | "calendar" | "decision";
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
  hairstyle: "medium",
  hairColor: "#4a3728",
  shirtStyle: "tee",
  shirtColor: "#7c5cbf",
  bottomStyle: "pants",
  bottomColor: "#3d4f5f",
  shoes: "sneakers",
  accessory: "none",
  skinTone: "#f5d0b5",
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
