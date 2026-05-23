import type {
  CalendarSlot,
  Notification,
  Poll,
  RoomMessage,
  Suggestion,
  User,
  VirtualRoom,
} from "../types";

const KEYS = {
  users: "hangout_users",
  session: "hangout_session",
  rooms: "hangout_rooms",
  calendar: "hangout_calendar",
  polls: "hangout_polls",
  suggestions: "hangout_suggestions",
  notifications: "hangout_notifications",
  messages: "hangout_messages",
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
  return read<User[]>(KEYS.users, []);
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

export function getPolls(): Poll[] {
  return read<Poll[]>(KEYS.polls, []);
}

export function savePolls(polls: Poll[]): void {
  write(KEYS.polls, polls);
}

export function getSuggestions(): Suggestion[] {
  return read<Suggestion[]>(KEYS.suggestions, []);
}

export function saveSuggestions(suggestions: Suggestion[]): void {
  write(KEYS.suggestions, suggestions);
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

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function seedDemoFriends(currentUserId: string): void {
  const users = getUsers();
  if (users.some((u) => u.email === "alex@demo.com")) return;

  const demos: Omit<User, "friendIds">[] = [
    {
      id: generateId(),
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
      },
      online: true,
    },
    {
      id: generateId(),
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
      },
      online: false,
    },
    {
      id: generateId(),
      email: "jordan@demo.com",
      password: "demo123",
      displayName: "Jordan",
      avatar: {
        hairstyle: "bun",
        hairColor: "#1a1a2e",
        shirtStyle: "tee",
        shirtColor: "#9b5de5",
        bottomStyle: "pants",
        bottomColor: "#264653",
        shoes: "sandals",
      },
      online: true,
    },
  ];

  const demoUsers: User[] = demos.map((d) => ({
    ...d,
    friendIds: [] as string[],
  }));

  const demoIds = demoUsers.map((d) => d.id);
  demoUsers.forEach((d) => {
    d.friendIds = [
      currentUserId,
      ...demoIds.filter((id) => id !== d.id),
    ];
  });

  const current = users.find((u) => u.id === currentUserId);
  if (!current) return;

  const updatedCurrent: User = {
    ...current,
    friendIds: [...current.friendIds, ...demoIds],
  };

  saveUsers([
    ...users.filter((u) => u.id !== currentUserId),
    updatedCurrent,
    ...demoUsers,
  ]);
}
