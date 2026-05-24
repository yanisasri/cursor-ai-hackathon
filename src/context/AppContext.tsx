import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  appendMailboxNote,
  addPersonalRoomPendingRequest,
  createRoomRecord,
  createUser,
  createFriendRequest,
  createRoomInvite,
  ensurePersonalRoomsForRoom,
  generateId,
  getCalendarConnections,
  getCalendarEvents,
  getCalendarSlots,
  getDecisionOptionsByRoom,
  getFriendRequests,
  getNicknameRequests,
  getNotifications,
  getMailboxNotes,
  getPersonalRoomAccess,
  grantPersonalRoomAccessEntry,
  getPolls,
  getRoomInvites,
  getRoomNameChangeRequests,
  getRoomNicknames,
  getRooms,
  getSessionUserId,
  getSuggestions,
  getSuggestionCategoriesByRoom,
  deleteAccount as deleteAccountFromDb,
  getUsers,
  leaveRoom as leaveRoomRecord,
  proposeRoomNameChange,
  removeFriendship,
  removePersonalRoomPendingRequest,
  respondFriendRequest as respondFriendRequestDb,
  revokePersonalRoomGuest,
  respondRoomInvite,
  respondRoomNameChange as respondRoomNameChangeDb,
  saveCalendarConnections,
  saveCalendarEvents,
  saveCalendarSlots,
  saveDecisionOptions,
  saveNicknameRequests,
  saveNotifications,
  savePolls,
  saveRoomNicknames,
  saveSuggestions,
  saveSuggestionCategoriesByRoom,
  setPersonalRoomActiveGuest,
  setSessionUserId,
  setUserPresence,
  updateMailboxNoteRead,
  upsertUserAvatars,
  verifyCredentials,
} from "../lib/storage";
import { mergePersonalRoomAccessLists } from "../lib/personalRoomAccessMerge";
import {
  MAX_ROOM_MEMBERS,
  SUGGESTION_CATEGORIES,
  countMailboxWords,
  canPhysicallyEnterPersonalRoom,
  isApprovedPersonalGuest,
  MAILBOX_MAX_WORDS,
  type AvatarConfig,
  type CalendarConnection,
  type CalendarEvent,
  type CalendarSlot,
  type FriendRequest,
  type MailboxNote,
  type NicknameRequest,
  type Notification,
  type PersonalRoomAccess,
  type Poll,
  type RoomArea,
  type RoomDecisionOptions,
  type RoomInvite,
  type RoomNameChangeRequest,
  type RoomNickname,
  type Suggestion,
  type SuggestionCategory,
  type User,
  type UserPresence,
  type VirtualRoom,
} from "../types";

interface AppContextValue {
  user: User | null;
  users: User[];
  rooms: VirtualRoom[];
  calendarSlots: CalendarSlot[];
  calendarEvents: CalendarEvent[];
  calendarConnections: CalendarConnection[];
  polls: Poll[];
  suggestions: Suggestion[];
  suggestionCategoriesByRoom: Record<string, string[]>;
  decisionOptionsByRoom: Record<string, RoomDecisionOptions>;
  notifications: Notification[];
  friendRequests: FriendRequest[];
  roomInvites: RoomInvite[];
  roomNameChangeRequests: RoomNameChangeRequest[];
  roomNicknames: RoomNickname[];
  nicknameRequests: NicknameRequest[];
  personalRoomAccess: PersonalRoomAccess[];
  mailboxNotes: MailboxNote[];
  signUp: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => void;
  updateAvatar: (avatar: AvatarConfig) => void;
  addFriendByEmail: (email: string) => Promise<{ ok: boolean; error?: string }>;
  respondToFriendRequest: (
    otherUserId: string,
    accept: boolean
  ) => Promise<{ ok: boolean; error?: string }>;
  removeFriend: (friendId: string) => Promise<{ ok: boolean; error?: string }>;
  deleteAccount: () => Promise<{ ok: boolean; error?: string }>;
  leaveRoom: (roomId: string) => Promise<{ ok: boolean; error?: string }>;
  sendRoomInvite: (
    roomId: string,
    friendId: string
  ) => Promise<{ ok: boolean; error?: string }>;
  respondToRoomInvite: (
    inviteId: string,
    accept: boolean
  ) => Promise<{ ok: boolean; error?: string }>;
  proposeRoomNameChange: (
    roomId: string,
    newName: string
  ) => Promise<{ ok: boolean; error?: string }>;
  respondToRoomNameChange: (
    requestId: string,
    approve: boolean
  ) => Promise<{ ok: boolean; error?: string }>;
  createRoom: (data: {
    name: string;
    area: RoomArea;
    maxMembers: number;
    friendIds: string[];
    myNickname?: string;
  }) => Promise<VirtualRoom>;
  setRoomNickname: (roomId: string, userId: string, nickname: string) => void;
  requestNicknameForFriend: (
    roomId: string,
    toUserId: string,
    suggestedNickname: string
  ) => void;
  respondNicknameRequest: (id: string, accept: boolean) => void;
  getRoomDisplayName: (roomId: string, userId: string) => string;
  refresh: () => Promise<void>;
  refreshPersonalRoomAccess: () => Promise<void>;
  addCalendarSlot: (slot: Omit<CalendarSlot, "id">) => void;
  addCalendarEvent: (event: Omit<CalendarEvent, "id">) => void;
  createCalendarEventRequest: (event: Omit<CalendarEvent, "id">) => void;
  rsvpCalendarEvent: (eventId: string, join: boolean) => void;
  connectGoogleCalendar: () => void;
  connectAppleCalendar: () => void;
  createPoll: (roomId: string, options: string[]) => void;
  votePoll: (pollId: string, optionId: string) => void;
  addSuggestion: (data: {
    roomId: string;
    title: string;
    category: SuggestionCategory;
    link?: string;
    imageUrl?: string;
  }) => void;
  addSuggestionCategory: (roomId: string, categoryName: string) => void;
  removeSuggestionCategoryIfEmpty: (roomId: string, categoryName: string) => boolean;
  deleteSuggestion: (id: string) => void;
  likeSuggestion: (id: string) => void;
  getWeeklyTopSuggestions: (roomId: string) => Suggestion[];
  getArchivedSuggestions: (roomId: string) => Suggestion[];
  getRoomDecisionOptions: (roomId: string) => string[];
  getRoomDecisionTitle: (roomId: string) => string;
  setRoomDecisionOptions: (
    roomId: string,
    data: { title: string; options: string[] }
  ) => Promise<{ ok: boolean; error?: string }>;
  notifyRoomDecision: (roomId: string, title: string, message: string) => void;
  pushNotification: (
    type: Notification["type"],
    title: string,
    message: string
  ) => void;
  markNotificationRead: (id: string) => void;
  setPresence: (presence: UserPresence) => void;
  toggleOnline: (online: boolean) => void;
  requestPersonalRoomAccess: (roomId: string, ownerId: string) => { ok: boolean; error?: string };
  grantPersonalRoomAccess: (roomId: string, ownerId: string, userId: string) => { ok: boolean; error?: string };
  denyPersonalRoomAccess: (roomId: string, ownerId: string, userId: string) => void;
  leavePersonalRoom: (roomId: string, ownerId: string) => void;
  enterPersonalRoomAsGuest: (
    roomId: string,
    ownerId: string
  ) => { ok: boolean; error?: string };
  isApprovedPersonalRoom: (roomId: string, ownerId: string, userId: string) => boolean;
  canEnterPersonalRoom: (roomId: string, ownerId: string, userId: string) => boolean;
  sendMailboxNote: (input: {
    roomId: string;
    ownerId: string;
    body: string;
    paperColor: string;
    envelopeColor: string;
    stickers: string[];
    inReplyToId?: string | null;
  }) => Promise<{ ok: boolean; error?: string }>;
  markMailboxNoteRead: (noteId: string) => void;
  ensureRoomSetup: (roomId: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [rooms, setRooms] = useState<VirtualRoom[]>([]);
  const [calendarSlots, setCalendarSlots] = useState<CalendarSlot[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [calendarConnections, setCalendarConnections] = useState<CalendarConnection[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionCategoriesByRoom, setSuggestionCategoriesByRoom] = useState<
    Record<string, string[]>
  >({});
  const [decisionOptionsByRoom, setDecisionOptionsByRoom] = useState<
    Record<string, RoomDecisionOptions>
  >({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [roomInvites, setRoomInvites] = useState<RoomInvite[]>([]);
  const [roomNameChangeRequests, setRoomNameChangeRequests] = useState<RoomNameChangeRequest[]>(
    []
  );
  const [roomNicknames, setRoomNicknames] = useState<RoomNickname[]>([]);
  const [nicknameRequests, setNicknameRequests] = useState<NicknameRequest[]>([]);
  const [personalRoomAccess, setPersonalRoomAccess] = useState<PersonalRoomAccess[]>([]);
  const [mailboxNotes, setMailboxNotes] = useState<MailboxNote[]>([]);

  const loadAll = useCallback(async () => {
    const sessionId = getSessionUserId();
    const [
      allUsers,
      allRooms,
      allEvents,
      allConnections,
      allPolls,
      allSuggestions,
      allCategoryMap,
      allDecisionOptions,
      allNotifications,
      allFriendRequests,
      allRoomInvites,
      allRoomNameChanges,
      allNicknames,
      allNicknameRequests,
      allPersonalAccess,
      allMailboxNotes,
    ] = await Promise.all([
      getUsers(),
      getRooms(),
      getCalendarEvents(),
      getCalendarConnections(),
      getPolls(),
      getSuggestions(),
      getSuggestionCategoriesByRoom(),
      getDecisionOptionsByRoom(),
      getNotifications(),
      getFriendRequests(),
      getRoomInvites(),
      getRoomNameChangeRequests(),
      getRoomNicknames(),
      getNicknameRequests(),
      getPersonalRoomAccess(),
      getMailboxNotes(),
    ]);

    setUsers(allUsers);
    setRooms(allRooms);
    setCalendarSlots(getCalendarSlots());
    setCalendarEvents(allEvents);
    setCalendarConnections(allConnections);
    setPolls(allPolls);
    setSuggestions(allSuggestions);
    setSuggestionCategoriesByRoom(allCategoryMap);
    setDecisionOptionsByRoom(allDecisionOptions);
    setNotifications(allNotifications);
    setFriendRequests(allFriendRequests);
    setRoomInvites(allRoomInvites);
    setRoomNameChangeRequests(allRoomNameChanges);
    setRoomNicknames(allNicknames);
    setNicknameRequests(allNicknameRequests);
    setPersonalRoomAccess((prev) => mergePersonalRoomAccessLists(allPersonalAccess, prev));
    setMailboxNotes(allMailboxNotes);
    if (sessionId) {
      const found = allUsers.find((u) => u.id === sessionId) ?? null;
      const latestUsers = await getUsers();
      setUsers(latestUsers);
      setUser(latestUsers.find((u) => u.id === sessionId) ?? found);
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const refreshPersonalRoomAccess = useCallback(async () => {
    try {
      const latest = await getPersonalRoomAccess();
      setPersonalRoomAccess((prev) => mergePersonalRoomAccessLists(latest, prev));
    } catch {
      /* keep local state */
    }
  }, []);

  const clearPersonalRoomPresenceForUser = useCallback(
    (userId: string, except?: { roomId: string; ownerId: string }) => {
      let changed = false;
      const updated = personalRoomAccess.map((entry) => {
        if (entry.ownerId === userId) return entry;
        let next = entry;
        if (entry.activeGuestId === userId) {
          next = { ...next, activeGuestId: null };
          changed = true;
          void setPersonalRoomActiveGuest(entry.roomId, entry.ownerId, null);
        }
        if (
          entry.grantedIds.includes(userId) &&
          (!except ||
            entry.roomId !== except.roomId ||
            entry.ownerId !== except.ownerId)
        ) {
          next = {
            ...next,
            grantedIds: next.grantedIds.filter((id) => id !== userId),
          };
          changed = true;
          void revokePersonalRoomGuest(entry.roomId, entry.ownerId, userId);
        }
        return next;
      });
      if (changed) setPersonalRoomAccess(updated);
    },
    [personalRoomAccess]
  );

  /** Best-effort — social notifications use friend/room types that need DB migration. */
  const appendNotifications = useCallback(
    async (extra: Notification[]) => {
      if (extra.length === 0) return;
      try {
        await saveNotifications([...notifications, ...extra]);
      } catch {
        // Core action already succeeded; run supabase/notifications_type_fix.sql to enable these.
      }
    },
    [notifications]
  );

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      const result = await createUser(email, password);
      if (!result.ok) return result;
      setSessionUserId(result.user.id);
      await loadAll();
      return { ok: true };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Sign up failed. Please try again.";
      return { ok: false, error: message };
    }
  }, [loadAll]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const found = await verifyCredentials(email, password);
      if (!found) return { ok: false, error: "Invalid email or password." };

      await setUserPresence(found.id, "online");

      setSessionUserId(found.id);

      await loadAll();
      return { ok: true };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Sign in failed. Please try again.";
      return { ok: false, error: message };
    }
  }, [loadAll]);

  const signOut = useCallback(() => {
    if (user) {
      clearPersonalRoomPresenceForUser(user.id);
      void setUserPresence(user.id, "offline").then(() => loadAll());
    }
    setSessionUserId(null);
    setUser(null);
  }, [user, loadAll, clearPersonalRoomPresenceForUser]);

  const updateAvatar = useCallback(
    (avatar: AvatarConfig) => {
      if (!user) return;
      void upsertUserAvatars([{ ...user, avatar, avatarCustomized: true }]).then(() =>
        loadAll()
      );
    },
    [user, loadAll]
  );

  const addFriendByEmail = useCallback(
    async (email: string) => {
      if (!user) return { ok: false, error: "Not signed in." };
      const normalized = email.trim().toLowerCase();
      const friend = users.find((u) => u.email === normalized);
      if (!friend) return { ok: false, error: "No user found with that email." };
      if (friend.id === user.id) return { ok: false, error: "You cannot add yourself." };
      if (user.friendIds.includes(friend.id)) {
        return { ok: false, error: "Already friends." };
      }

      const pairHas = (a: string, b: string) =>
        friendRequests.some(
          (r) =>
            r.status === "pending" &&
            ((r.userId === a && r.friendId === b) || (r.userId === b && r.friendId === a))
        );

      if (pairHas(user.id, friend.id)) {
        const incoming = friendRequests.find(
          (r) =>
            r.status === "pending" &&
            r.requestedBy === friend.id &&
            ((r.userId === user.id && r.friendId === friend.id) ||
              (r.userId === friend.id && r.friendId === user.id))
        );
        if (incoming) {
          return {
            ok: false,
            error: "They already sent you a request — accept it below.",
          };
        }
        return { ok: false, error: "Friend request already sent." };
      }

      try {
        await createFriendRequest(user.id, friend.id);
        const now = new Date().toISOString();
        await appendNotifications([
          {
            id: generateId(),
            userId: friend.id,
            type: "friend",
            title: "Friend request",
            message: `${user.displayName} wants to be your friend.`,
            read: false,
            createdAt: now,
          },
        ]);
        await loadAll();
        return { ok: true };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not send friend request.";
        return { ok: false, error: message };
      }
    },
    [user, users, friendRequests, appendNotifications, loadAll]
  );

  const respondToFriendRequest = useCallback(
    async (otherUserId: string, accept: boolean) => {
      if (!user) return { ok: false, error: "Not signed in." };
      try {
        await respondFriendRequestDb(user.id, otherUserId, accept);
        if (accept) {
          const now = new Date().toISOString();
          await appendNotifications([
            {
              id: generateId(),
              userId: otherUserId,
              type: "friend",
              title: "Friend request accepted",
              message: `${user.displayName} accepted your friend request.`,
              read: false,
              createdAt: now,
            },
          ]);
        }
        await loadAll();
        return { ok: true };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not respond to friend request.";
        return { ok: false, error: message };
      }
    },
    [user, appendNotifications, loadAll]
  );

  const removeFriend = useCallback(
    async (friendId: string) => {
      if (!user) return { ok: false, error: "Not signed in." };
      if (friendId === user.id) return { ok: false, error: "Invalid friend." };
      if (!user.friendIds.includes(friendId)) {
        return { ok: false, error: "You are not friends with this user." };
      }
      try {
        await removeFriendship(user.id, friendId);
        await loadAll();
        return { ok: true };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not remove friend.";
        return { ok: false, error: message };
      }
    },
    [user, loadAll]
  );

  const sendRoomInvite = useCallback(
    async (roomId: string, friendId: string) => {
      if (!user) return { ok: false, error: "Not signed in." };
      if (!user.friendIds.includes(friendId)) {
        return { ok: false, error: "You can only invite friends." };
      }
      const room = rooms.find((r) => r.id === roomId);
      if (!room) return { ok: false, error: "Room not found." };
      try {
        await createRoomInvite(roomId, user.id, friendId);
        const now = new Date().toISOString();
        await appendNotifications([
          {
            id: generateId(),
            userId: friendId,
            type: "room",
            title: "Room invite",
            message: `${user.displayName} invited you to join "${room.name}".`,
            read: false,
            createdAt: now,
          },
        ]);
        await loadAll();
        return { ok: true };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not send invite.";
        return { ok: false, error: message };
      }
    },
    [user, rooms, appendNotifications, loadAll]
  );

  const respondToRoomInvite = useCallback(
    async (inviteId: string, accept: boolean) => {
      if (!user) return { ok: false, error: "Not signed in." };
      const invite = roomInvites.find((i) => i.id === inviteId);
      if (!invite) return { ok: false, error: "Invite not found." };
      const room = rooms.find((r) => r.id === invite.roomId);
      try {
        await respondRoomInvite(inviteId, user.id, accept);
        if (accept && room) {
          const now = new Date().toISOString();
          await appendNotifications([
            {
              id: generateId(),
              userId: invite.fromUserId,
              type: "room",
              title: "Invite accepted",
              message: `${user.displayName} joined "${room.name}".`,
              read: false,
              createdAt: now,
            },
          ]);
        }
        await loadAll();
        return { ok: true };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not respond to invite.";
        return { ok: false, error: message };
      }
    },
    [user, roomInvites, rooms, appendNotifications, loadAll]
  );

  const proposeRoomNameChangeHandler = useCallback(
    async (roomId: string, newName: string) => {
      if (!user) return { ok: false, error: "Not signed in." };
      const room = rooms.find((r) => r.id === roomId);
      if (!room) return { ok: false, error: "Room not found." };
      try {
        await proposeRoomNameChange(roomId, user.id, newName);
        const trimmed = newName.trim();
        const now = new Date().toISOString();
        const memberNotifications = room.memberIds
          .filter((id) => id !== user.id)
          .map((memberId) => ({
            id: generateId(),
            userId: memberId,
            type: "room" as const,
            title: "Room rename requested",
            message: `${user.displayName} wants to rename "${room.name}" to "${trimmed}". Approve in room settings.`,
            read: false,
            createdAt: now,
          }));
        if (memberNotifications.length > 0) {
          await appendNotifications(memberNotifications);
        }
        await loadAll();
        return { ok: true };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not propose name change.";
        return { ok: false, error: message };
      }
    },
    [user, rooms, appendNotifications, loadAll]
  );

  const respondToRoomNameChange = useCallback(
    async (requestId: string, approve: boolean) => {
      if (!user) return { ok: false, error: "Not signed in." };
      const request = roomNameChangeRequests.find((r) => r.id === requestId);
      if (!request) return { ok: false, error: "Request not found." };
      const room = rooms.find((r) => r.id === request.roomId);
      try {
        const result = await respondRoomNameChangeDb(requestId, user.id, approve);
        const now = new Date().toISOString();
        const proposer = users.find((u) => u.id === request.proposedByUserId);
        const extra: Notification[] = [];

        if (!approve) {
          if (proposer) {
            extra.push({
              id: generateId(),
              userId: proposer.id,
              type: "room",
              title: "Rename declined",
              message: `${user.displayName} declined renaming the room to "${request.proposedName}".`,
              read: false,
              createdAt: now,
            });
          }
        } else if (result.applied && room) {
          for (const memberId of room.memberIds) {
            extra.push({
              id: generateId(),
              userId: memberId,
              type: "room",
              title: "Room renamed",
              message: `Everyone approved — this room is now called "${request.proposedName}".`,
              read: false,
              createdAt: now,
            });
          }
        } else if (approve && proposer) {
          extra.push({
            id: generateId(),
            userId: proposer.id,
            type: "room",
            title: "Rename approval",
            message: `${user.displayName} approved renaming to "${request.proposedName}".`,
            read: false,
            createdAt: now,
          });
        }

        if (extra.length > 0) {
          await appendNotifications(extra);
        }
        await loadAll();
        return { ok: true };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not respond to name change.";
        return { ok: false, error: message };
      }
    },
    [user, roomNameChangeRequests, rooms, users, appendNotifications, loadAll]
  );

  const deleteAccount = useCallback(async () => {
    if (!user) return { ok: false, error: "Not signed in." };
    try {
      await setUserPresence(user.id, "offline");
      await deleteAccountFromDb(user.id);
      setSessionUserId(null);
      setUser(null);
      return { ok: true };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not delete account.";
      return { ok: false, error: message };
    }
  }, [user]);

  const leaveRoom = useCallback(
    async (roomId: string) => {
      if (!user) return { ok: false, error: "Not signed in." };
      try {
        await leaveRoomRecord(roomId, user.id);
        await loadAll();
        return { ok: true };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not leave room.";
        return { ok: false, error: message };
      }
    },
    [user, loadAll]
  );

  const setRoomNickname = useCallback(
    (roomId: string, userId: string, nickname: string) => {
      const trimmed = nickname.trim();
      if (!trimmed) return;
      const all = roomNicknames.filter(
        (n) => !(n.roomId === roomId && n.userId === userId)
      );
      void saveRoomNicknames([...all, { roomId, userId, nickname: trimmed }]).then(() =>
        loadAll()
      );
    },
    [roomNicknames, loadAll]
  );

  const requestNicknameForFriend = useCallback(
    (roomId: string, toUserId: string, suggestedNickname: string) => {
      if (!user) return;
      const req: NicknameRequest = {
        id: generateId(),
        roomId,
        fromUserId: user.id,
        toUserId,
        suggestedNickname: suggestedNickname.trim(),
        status: "pending",
      };
      void saveNicknameRequests([...nicknameRequests, req]).then(() => loadAll());
    },
    [user, nicknameRequests, loadAll]
  );

  const respondNicknameRequest = useCallback(
    (id: string, accept: boolean) => {
      const reqs = nicknameRequests;
      const req = reqs.find((r) => r.id === id);
      if (!req) return;
      const updated = reqs.map((r) =>
        r.id === id ? { ...r, status: accept ? "accepted" as const : "declined" as const } : r
      );
      void saveNicknameRequests(updated);
      if (accept) {
        setRoomNickname(req.roomId, req.toUserId, req.suggestedNickname);
      }
      void loadAll();
    },
    [nicknameRequests, loadAll, setRoomNickname]
  );

  const getRoomDisplayName = useCallback(
    (roomId: string, userId: string) => {
      const nick = roomNicknames.find(
        (n) => n.roomId === roomId && n.userId === userId
      );
      if (nick) return nick.nickname;
      return users.find((u) => u.id === userId)?.displayName ?? "Friend";
    },
    [roomNicknames, users]
  );

  const createRoom = useCallback(
    async (data: {
      name: string;
      area: RoomArea;
      maxMembers: number;
      friendIds: string[];
      myNickname?: string;
    }) => {
      if (!user) throw new Error("Not signed in");
      const memberIds = Array.from(new Set([user.id, ...data.friendIds])).slice(
        0,
        Math.min(data.maxMembers, MAX_ROOM_MEMBERS)
      );

      const room: VirtualRoom = {
        id: generateId(),
        name: data.name,
        area: data.area,
        maxMembers: Math.min(data.maxMembers, MAX_ROOM_MEMBERS),
        memberIds,
        ownerId: user.id,
        createdAt: new Date().toISOString(),
      };
      await createRoomRecord(room);
      if (data.myNickname?.trim()) {
        setRoomNickname(room.id, user.id, data.myNickname.trim());
      }
      try {
        await ensurePersonalRoomsForRoom(room);
      } catch {
        // Personal-room setup should not block entering a newly created room.
      }
      await loadAll();
      return room;
    },
    [user, loadAll, setRoomNickname]
  );

  const ensureRoomSetup = useCallback(
    (roomId: string) => {
      const room = rooms.find((r) => r.id === roomId);
      if (room) void ensurePersonalRoomsForRoom(room).then(() => loadAll());
    },
    [rooms, loadAll]
  );

  const addCalendarSlot = useCallback(
    (slot: Omit<CalendarSlot, "id">) => {
      saveCalendarSlots([...getCalendarSlots(), { ...slot, id: generateId() }]);
      void loadAll();
    },
    [loadAll]
  );

  const addCalendarEvent = useCallback(
    (event: Omit<CalendarEvent, "id">) => {
      void saveCalendarEvents([...calendarEvents, { ...event, id: generateId() }]).then(() =>
        loadAll()
      );
    },
    [calendarEvents, loadAll]
  );

  const createCalendarEventRequest = useCallback(
    (event: Omit<CalendarEvent, "id">) => {
      const request: CalendarEvent = {
        ...event,
        id: generateId(),
        status: "pending",
        rsvpUserIds: [],
        syncedToGoogleUserIds: [],
        syncedToAppleUserIds: [],
      };
      void saveCalendarEvents([...calendarEvents, request]).then(() => loadAll());
    },
    [calendarEvents, loadAll]
  );

  const rsvpCalendarEvent = useCallback(
    (eventId: string, join: boolean) => {
      if (!user) return;
      const updated: CalendarEvent[] = calendarEvents.map((e): CalendarEvent => {
        if (e.id !== eventId) return e;
        const current = e.rsvpUserIds ?? [];
        const nextRsvps = join
          ? [...new Set([...current, user.id])]
          : current.filter((id) => id !== user.id);
        const isConfirmed = nextRsvps.length > 0;
        const userConn = calendarConnections.find((c) => c.userId === user.id);
        return {
          ...e,
          status: isConfirmed ? "confirmed" : "pending",
          rsvpUserIds: nextRsvps,
          syncedToGoogleUserIds:
            join && userConn?.googleConnected
              ? [...new Set([...(e.syncedToGoogleUserIds ?? []), user.id])]
              : e.syncedToGoogleUserIds ?? [],
          syncedToAppleUserIds:
            join && userConn?.appleConnected
              ? [...new Set([...(e.syncedToAppleUserIds ?? []), user.id])]
              : e.syncedToAppleUserIds ?? [],
        };
      });
      void saveCalendarEvents(updated).then(() => loadAll());
    },
    [user, calendarEvents, calendarConnections, loadAll]
  );

  const connectGoogleCalendar = useCallback(() => {
    if (!user) return;
    const all = calendarConnections;
    const existing = all.find((c) => c.userId === user.id);
    const next = existing
      ? all.map((c) =>
          c.userId === user.id ? { ...c, googleConnected: true } : c
        )
      : [...all, { userId: user.id, googleConnected: true, appleConnected: false }];
    void saveCalendarConnections(next);
    const demoEvents: CalendarEvent[] = [
      {
        id: generateId(),
        roomId: "",
        userId: user.id,
        title: "Study block (Google)",
        location: "Library",
        startAt: new Date(Date.now() + 86400000).toISOString(),
        endAt: new Date(Date.now() + 86400000 + 7200000).toISOString(),
        source: "google",
      },
    ];
    void saveCalendarEvents([...calendarEvents, ...demoEvents]).then(() => loadAll());
  }, [user, calendarConnections, calendarEvents, loadAll]);

  const connectAppleCalendar = useCallback(() => {
    if (!user) return;
    const all = calendarConnections;
    const existing = all.find((c) => c.userId === user.id);
    const next = existing
      ? all.map((c) =>
          c.userId === user.id ? { ...c, appleConnected: true } : c
        )
      : [...all, { userId: user.id, googleConnected: false, appleConnected: true }];
    void saveCalendarConnections(next).then(() => loadAll());
  }, [user, calendarConnections, loadAll]);

  const createPoll = useCallback(
    (roomId: string, options: string[]) => {
      if (!user) return;
      const question = decisionOptionsByRoom[roomId]?.title?.trim() ?? "";
      if (!question) return;
      const nextPolls = [
        ...polls,
        {
          id: generateId(),
          roomId,
          question,
          options: options.map((text) => ({ id: generateId(), text, votes: [] })),
          createdBy: user.id,
        },
      ];
      const actor = users.find((u) => u.id === user.id)?.displayName ?? "Someone";
      const room = rooms.find((r) => r.id === roomId);
      const memberIds = room?.memberIds ?? [];
      const now = new Date().toISOString();
      const pollNotifications: Notification[] = memberIds.map((memberId) => ({
        id: generateId(),
        userId: memberId,
        type: "decision" as const,
        title: "Poll started",
        message: `${actor} started a poll: "${question}"`,
        read: false,
        createdAt: now,
      }));
      void Promise.all([savePolls(nextPolls), saveNotifications([...notifications, ...pollNotifications])]).then(
        () => loadAll()
      );
    },
    [user, users, rooms, polls, notifications, decisionOptionsByRoom, loadAll]
  );

  const votePoll = useCallback(
    (pollId: string, optionId: string) => {
      if (!user) return;
      const poll = polls.find((p) => p.id === pollId);
      const option = poll?.options.find((o) => o.id === optionId);
      const actor = users.find((u) => u.id === user.id)?.displayName ?? "Someone";
      void savePolls(
        polls.map((p) =>
          p.id !== pollId
            ? p
            : {
                ...p,
                options: p.options.map((o) => {
                  const without = o.votes.filter((v) => v !== user.id);
                  return o.id === optionId
                    ? { ...o, votes: [...without, user.id] }
                    : { ...o, votes: without };
                }),
              }
        )
      ).then(() => {
        if (poll && option) {
          const room = rooms.find((r) => r.id === poll.roomId);
          const memberIds = room?.memberIds ?? [];
          const now = new Date().toISOString();
          const voteNotifications: Notification[] = memberIds.map((memberId) => ({
            id: generateId(),
            userId: memberId,
            type: "decision" as const,
            title: "Poll vote",
            message: `${actor} voted for "${option.text}" in "${poll.question}"`,
            read: false,
            createdAt: now,
          }));
          void saveNotifications([...notifications, ...voteNotifications]).then(() => loadAll());
        } else {
          void loadAll();
        }
      });
    },
    [user, users, rooms, polls, notifications, loadAll]
  );

  const addSuggestion = useCallback(
    (data: {
      roomId: string;
      title: string;
      category: SuggestionCategory;
      link?: string;
      imageUrl?: string;
    }) => {
      if (!user) return;
      const item: Suggestion = {
        id: generateId(),
        roomId: data.roomId,
        title: data.title,
        category: data.category,
        addedBy: user.id,
        likes: [],
        link: data.link,
        imageUrl: data.imageUrl,
        createdAt: new Date().toISOString(),
        archived: false,
      };
      void saveSuggestions([...suggestions, item]).then(() => loadAll());
    },
    [user, suggestions, loadAll]
  );

  const addSuggestionCategory = useCallback(
    (roomId: string, categoryName: string) => {
      const normalized = categoryName.trim().toLowerCase();
      if (!normalized) return;
      const isBuiltIn = SUGGESTION_CATEGORIES.some((c) => c.id === normalized);
      if (isBuiltIn) return;
      const all = suggestionCategoriesByRoom;
      const existing = all[roomId] ?? [];
      if (existing.includes(normalized)) return;
      void saveSuggestionCategoriesByRoom({
        ...all,
        [roomId]: [...existing, normalized],
      }).then(() => loadAll());
    },
    [suggestionCategoriesByRoom, loadAll]
  );

  const removeSuggestionCategoryIfEmpty = useCallback(
    (roomId: string, categoryName: string) => {
      const normalized = categoryName.trim().toLowerCase();
      if (!normalized || normalized === "other") return false;
      const hasAnySuggestions = suggestions.some(
        (s) => s.roomId === roomId && s.category.toLowerCase() === normalized
      );
      if (hasAnySuggestions) return false;
      const all = suggestionCategoriesByRoom;
      const existing = all[roomId] ?? [];
      if (!existing.includes(normalized)) return false;
      void saveSuggestionCategoriesByRoom({
        ...all,
        [roomId]: existing.filter((c) => c !== normalized),
      }).then(() => loadAll());
      return true;
    },
    [suggestions, suggestionCategoriesByRoom, loadAll]
  );

  const deleteSuggestion = useCallback(
    (id: string) => {
      if (!user) return;
      const item = suggestions.find((s) => s.id === id);
      if (!item || item.addedBy !== user.id) return;
      void saveSuggestions(suggestions.filter((s) => s.id !== id)).then(() => loadAll());
    },
    [user, suggestions, loadAll]
  );

  const likeSuggestion = useCallback(
    (id: string) => {
      if (!user) return;
      void saveSuggestions(
        suggestions.map((s) => {
          if (s.id !== id) return s;
          const has = s.likes.includes(user.id);
          return {
            ...s,
            likes: has ? s.likes.filter((l) => l !== user.id) : [...s.likes, user.id],
          };
        })
      ).then(() => loadAll());
    },
    [user, suggestions, loadAll]
  );

  const getWeeklyTopSuggestions = useCallback((roomId: string) => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return suggestions
      .filter(
        (s) =>
          s.roomId === roomId &&
          !s.archived &&
          new Date(s.createdAt).getTime() >= weekAgo
      )
      .sort((a, b) => b.likes.length - a.likes.length)
      .slice(0, 10);
  }, [suggestions]);

  const getArchivedSuggestions = useCallback((roomId: string) => {
    return suggestions.filter((s) => s.roomId === roomId && s.archived);
  }, [suggestions]);

  const getRoomDecisionOptions = useCallback(
    (roomId: string) => decisionOptionsByRoom[roomId]?.options ?? [],
    [decisionOptionsByRoom]
  );

  const getRoomDecisionTitle = useCallback(
    (roomId: string) => decisionOptionsByRoom[roomId]?.title?.trim() ?? "",
    [decisionOptionsByRoom]
  );

  const notifyRoomDecision = useCallback(
    (roomId: string, title: string, message: string) => {
      const room = rooms.find((r) => r.id === roomId);
      if (!room) return;
      const now = new Date().toISOString();
      const decisionNotifications: Notification[] = room.memberIds.map((memberId) => ({
        id: generateId(),
        userId: memberId,
        type: "decision" as const,
        title,
        message,
        read: false,
        createdAt: now,
      }));
      void saveNotifications([...notifications, ...decisionNotifications]).then(() => loadAll());
    },
    [rooms, notifications, loadAll]
  );

  const setRoomDecisionOptionsHandler = useCallback(
    async (roomId: string, data: { title: string; options: string[] }) => {
      if (!user) return { ok: false, error: "Not signed in." };
      const room = rooms.find((r) => r.id === roomId);
      if (!room?.memberIds.includes(user.id)) {
        return { ok: false, error: "You are not in this room." };
      }
      const title = data.title.trim();
      if (!title) {
        return { ok: false, error: "Add a decision title." };
      }
      if (data.options.length < 2) {
        return { ok: false, error: "Add at least two options." };
      }
      try {
        await saveDecisionOptions(roomId, title, data.options, user.id);
        await loadAll();
        return { ok: true };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not save decision options.";
        return { ok: false, error: message };
      }
    },
    [user, rooms, loadAll]
  );

  const pushNotification = useCallback(
    (type: Notification["type"], title: string, message: string) => {
      if (!user) return;
      void saveNotifications([
        ...notifications,
        {
          id: generateId(),
          userId: user.id,
          type,
          title,
          message,
          read: false,
          createdAt: new Date().toISOString(),
        },
      ]).then(() => loadAll());
    },
    [user, notifications, loadAll]
  );

  const markNotificationRead = useCallback(
    (id: string) => {
      void saveNotifications(
        notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
      ).then(() => loadAll());
    },
    [notifications, loadAll]
  );

  const setPresence = useCallback(
    (presence: UserPresence) => {
      if (!user) return;
      if (presence === "offline") {
        clearPersonalRoomPresenceForUser(user.id);
      }
      void setUserPresence(user.id, presence).then(() => loadAll());
    },
    [user, loadAll, clearPersonalRoomPresenceForUser]
  );

  const toggleOnline = useCallback(
    (online: boolean) => {
      setPresence(online ? "online" : "offline");
    },
    [setPresence]
  );

  useEffect(() => {
    if (!user || user.presence === "offline") return;
    const idleMs = 5 * 60 * 1000;
    let idleTimer: ReturnType<typeof setTimeout>;

    const bumpActivity = () => {
      clearTimeout(idleTimer);
      if (user.presence === "idle") {
        void setUserPresence(user.id, "online").then(() => loadAll());
      }
      idleTimer = setTimeout(() => {
        void setUserPresence(user.id, "idle").then(() => loadAll());
      }, idleMs);
    };

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;
    for (const event of events) {
      window.addEventListener(event, bumpActivity, { passive: true });
    }
    bumpActivity();

    return () => {
      clearTimeout(idleTimer);
      for (const event of events) {
        window.removeEventListener(event, bumpActivity);
      }
    };
  }, [user?.id, user?.presence, loadAll]);

  const requestPersonalRoomAccess = useCallback(
    (roomId: string, ownerId: string) => {
      if (!user) return { ok: false, error: "Not signed in." };
      if (user.id === ownerId) return { ok: true };
      const all = personalRoomAccess;
      const idx = all.findIndex((a) => a.roomId === roomId && a.ownerId === ownerId);
      if (idx < 0) return { ok: false, error: "Room not found." };
      const entry = all[idx];
      if (entry.grantedIds.includes(user.id)) return { ok: true };
      if (entry.pendingRequests.some((r) => r.userId === user.id)) {
        return { ok: false, error: "Request already pending." };
      }
      const requestedAt = new Date().toISOString();
      const updated = [...all];
      updated[idx] = {
        ...entry,
        pendingRequests: [...entry.pendingRequests, { userId: user.id, requestedAt }],
      };
      setPersonalRoomAccess(updated);
      void addPersonalRoomPendingRequest(roomId, ownerId, user.id, requestedAt);
      return { ok: true };
    },
    [user, personalRoomAccess]
  );

  const grantPersonalRoomAccess = useCallback(
    (roomId: string, ownerId: string, grantUserId: string) => {
      const all = personalRoomAccess;
      const idx = all.findIndex((a) => a.roomId === roomId && a.ownerId === ownerId);
      if (idx < 0) return { ok: false, error: "Room not found." };
      const entry = all[idx];
      const updated = [...all];
      updated[idx] = {
        ...entry,
        grantedIds: [...new Set([...entry.grantedIds, grantUserId])],
        pendingRequests: entry.pendingRequests.filter((r) => r.userId !== grantUserId),
      };
      setPersonalRoomAccess(updated);
      void grantPersonalRoomAccessEntry(roomId, ownerId, grantUserId);
      return { ok: true };
    },
    [personalRoomAccess]
  );

  const denyPersonalRoomAccess = useCallback(
    (roomId: string, ownerId: string, denyUserId: string) => {
      const all = personalRoomAccess;
      const idx = all.findIndex((a) => a.roomId === roomId && a.ownerId === ownerId);
      if (idx < 0) return;
      const entry = all[idx];
      const updated = [...all];
      updated[idx] = {
        ...entry,
        pendingRequests: entry.pendingRequests.filter((r) => r.userId !== denyUserId),
      };
      setPersonalRoomAccess(updated);
      void removePersonalRoomPendingRequest(roomId, ownerId, denyUserId);
    },
    [personalRoomAccess]
  );

  const leavePersonalRoom = useCallback(
    (roomId: string, ownerId: string) => {
      if (!user || user.id === ownerId) return;
      const all = personalRoomAccess;
      const idx = all.findIndex((a) => a.roomId === roomId && a.ownerId === ownerId);
      if (idx < 0) return;
      const entry = all[idx];
      if (entry.activeGuestId !== user.id) return;
      const updated = [...all];
      updated[idx] = { ...entry, activeGuestId: null };
      setPersonalRoomAccess(updated);
      void setPersonalRoomActiveGuest(roomId, ownerId, null);
    },
    [user, personalRoomAccess]
  );

  const enterPersonalRoomAsGuest = useCallback(
    (roomId: string, ownerId: string) => {
      if (!user) return { ok: false, error: "Not signed in." };
      if (user.id === ownerId) return { ok: true };
      const all = personalRoomAccess;
      const idx = all.findIndex((a) => a.roomId === roomId && a.ownerId === ownerId);
      if (idx < 0) return { ok: false, error: "Room not found." };
      const entry = all[idx];
      if (!isApprovedPersonalGuest(entry, user.id)) {
        return { ok: false, error: "You need approval to enter." };
      }
      if (
        entry.activeGuestId != null &&
        entry.activeGuestId !== user.id
      ) {
        return { ok: false, error: "Someone else is visiting — wait your turn." };
      }

      const updated = all.map((a) => {
        if (a.roomId !== roomId) return a;
        if (a.ownerId === user.id) return a;
        if (a.ownerId === ownerId) {
          return { ...a, activeGuestId: user.id };
        }
        if (a.activeGuestId === user.id) {
          void setPersonalRoomActiveGuest(a.roomId, a.ownerId, null);
          return { ...a, activeGuestId: null };
        }
        if (a.grantedIds.includes(user.id)) {
          void revokePersonalRoomGuest(a.roomId, a.ownerId, user.id);
          return {
            ...a,
            grantedIds: a.grantedIds.filter((id) => id !== user.id),
          };
        }
        return a;
      });

      setPersonalRoomAccess(updated);
      void setPersonalRoomActiveGuest(roomId, ownerId, user.id);
      return { ok: true };
    },
    [user, personalRoomAccess]
  );

  const isApprovedPersonalRoom = useCallback(
    (roomId: string, ownerId: string, visitorId: string) => {
      if (visitorId === ownerId) return true;
      const entry = personalRoomAccess.find(
        (a) => a.roomId === roomId && a.ownerId === ownerId
      );
      return entry ? isApprovedPersonalGuest(entry, visitorId) : false;
    },
    [personalRoomAccess]
  );

  const canEnterPersonalRoom = useCallback(
    (roomId: string, ownerId: string, visitorId: string) => {
      if (visitorId === ownerId) return true;
      const entry = personalRoomAccess.find(
        (a) => a.roomId === roomId && a.ownerId === ownerId
      );
      return entry ? canPhysicallyEnterPersonalRoom(entry, visitorId) : false;
    },
    [personalRoomAccess]
  );

  const sendMailboxNote = useCallback(
    async (input: {
      roomId: string;
      ownerId: string;
      body: string;
      paperColor: string;
      envelopeColor: string;
      stickers: string[];
      inReplyToId?: string | null;
    }) => {
      if (!user) return { ok: false, error: "Not signed in." };
      if (user.id === input.ownerId) {
        return { ok: false, error: "You cannot mail yourself." };
      }
      const words = countMailboxWords(input.body);
      if (words === 0) return { ok: false, error: "Write something first." };
      if (words > MAILBOX_MAX_WORDS) {
        return { ok: false, error: `Notes are limited to ${MAILBOX_MAX_WORDS} words.` };
      }

      const note: MailboxNote = {
        id: generateId(),
        roomId: input.roomId,
        ownerId: input.ownerId,
        fromUserId: user.id,
        body: input.body.trim(),
        paperColor: input.paperColor,
        envelopeColor: input.envelopeColor,
        stickers: input.stickers,
        read: false,
        inReplyToId: input.inReplyToId ?? null,
        createdAt: new Date().toISOString(),
      };

      try {
        await appendMailboxNote(note);
        const senderName = user.displayName;
        await appendNotifications([
          {
            id: generateId(),
            userId: input.ownerId,
            type: "room",
            title: "New mailbox note",
            message: `${senderName} left a note at your personal room door.`,
            read: false,
            createdAt: note.createdAt,
          },
        ]);
        await loadAll();
        return { ok: true };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not send note.";
        return { ok: false, error: message };
      }
    },
    [user, appendNotifications, loadAll]
  );

  const markMailboxNoteRead = useCallback(
    (noteId: string) => {
      setMailboxNotes((notes) =>
        notes.map((n) => (n.id === noteId ? { ...n, read: true } : n))
      );
      void updateMailboxNoteRead(noteId).then(() => loadAll());
    },
    [loadAll]
  );

  const value = useMemo(
    () => ({
      user,
      users,
      rooms,
      calendarSlots,
      calendarEvents,
      calendarConnections,
      polls,
      suggestions,
      suggestionCategoriesByRoom,
      decisionOptionsByRoom,
      notifications,
      friendRequests,
      roomInvites,
      roomNameChangeRequests,
      roomNicknames,
      nicknameRequests,
      personalRoomAccess,
      mailboxNotes,
      signUp,
      signIn,
      signOut,
      updateAvatar,
      addFriendByEmail,
      respondToFriendRequest,
      removeFriend,
      deleteAccount,
      leaveRoom,
      sendRoomInvite,
      respondToRoomInvite,
      proposeRoomNameChange: proposeRoomNameChangeHandler,
      respondToRoomNameChange,
      createRoom,
      setRoomNickname,
      requestNicknameForFriend,
      respondNicknameRequest,
      getRoomDisplayName,
      refresh: loadAll,
      refreshPersonalRoomAccess,
      addCalendarSlot,
      addCalendarEvent,
      createCalendarEventRequest,
      rsvpCalendarEvent,
      connectGoogleCalendar,
      connectAppleCalendar,
      createPoll,
      votePoll,
      addSuggestion,
      addSuggestionCategory,
      removeSuggestionCategoryIfEmpty,
      deleteSuggestion,
      likeSuggestion,
      getWeeklyTopSuggestions,
      getArchivedSuggestions,
      getRoomDecisionOptions,
      getRoomDecisionTitle,
      setRoomDecisionOptions: setRoomDecisionOptionsHandler,
      notifyRoomDecision,
      pushNotification,
      markNotificationRead,
      setPresence,
      toggleOnline,
      requestPersonalRoomAccess,
      grantPersonalRoomAccess,
      denyPersonalRoomAccess,
      leavePersonalRoom,
      enterPersonalRoomAsGuest,
      isApprovedPersonalRoom,
      canEnterPersonalRoom,
      sendMailboxNote,
      markMailboxNoteRead,
      ensureRoomSetup,
    }),
    [
      user,
      users,
      rooms,
      calendarSlots,
      calendarEvents,
      calendarConnections,
      polls,
      suggestions,
      suggestionCategoriesByRoom,
      decisionOptionsByRoom,
      notifications,
      friendRequests,
      roomInvites,
      roomNameChangeRequests,
      roomNicknames,
      nicknameRequests,
      personalRoomAccess,
      mailboxNotes,
      signUp,
      signIn,
      signOut,
      updateAvatar,
      addFriendByEmail,
      respondToFriendRequest,
      removeFriend,
      deleteAccount,
      leaveRoom,
      sendRoomInvite,
      respondToRoomInvite,
      proposeRoomNameChangeHandler,
      respondToRoomNameChange,
      createRoom,
      setRoomNickname,
      requestNicknameForFriend,
      respondNicknameRequest,
      getRoomDisplayName,
      loadAll,
      refreshPersonalRoomAccess,
      addCalendarSlot,
      addCalendarEvent,
      createCalendarEventRequest,
      rsvpCalendarEvent,
      connectGoogleCalendar,
      connectAppleCalendar,
      createPoll,
      votePoll,
      addSuggestion,
      addSuggestionCategory,
      removeSuggestionCategoryIfEmpty,
      deleteSuggestion,
      likeSuggestion,
      getWeeklyTopSuggestions,
      getArchivedSuggestions,
      getRoomDecisionOptions,
      getRoomDecisionTitle,
      setRoomDecisionOptionsHandler,
      notifyRoomDecision,
      pushNotification,
      markNotificationRead,
      setPresence,
      toggleOnline,
      requestPersonalRoomAccess,
      grantPersonalRoomAccess,
      denyPersonalRoomAccess,
      leavePersonalRoom,
      enterPersonalRoomAsGuest,
      isApprovedPersonalRoom,
      canEnterPersonalRoom,
      sendMailboxNote,
      markMailboxNoteRead,
      ensureRoomSetup,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
