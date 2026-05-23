export type Hairstyle = "short" | "medium" | "long" | "curly" | "bun";
export type BottomStyle = "pants" | "skirt";
export type ShirtStyle = "tee" | "hoodie" | "sweater";
export type ShoesStyle = "sneakers" | "boots" | "sandals";

export interface AvatarConfig {
  hairstyle: Hairstyle;
  hairColor: string;
  shirtStyle: ShirtStyle;
  shirtColor: string;
  bottomStyle: BottomStyle;
  bottomColor: string;
  shoes: ShoesStyle;
}

export interface User {
  id: string;
  email: string;
  password: string;
  displayName: string;
  avatar: AvatarConfig;
  friendIds: string[];
  online: boolean;
}

export type RoomArea =
  | "house"
  | "office"
  | "cafe"
  | "park";

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

export interface CalendarSlot {
  id: string;
  userId: string;
  label: string;
  day: string;
  startHour: number;
  endHour: number;
  free: boolean;
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

export interface Suggestion {
  id: string;
  roomId: string;
  title: string;
  category: "restaurant" | "activity" | "movie" | "game" | "other";
  addedBy: string;
  likes: string[];
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
};

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
  { id: "personal", label: "Personal Room", description: "Private space — request to enter" },
];

export const MAX_ROOM_MEMBERS = 8;
