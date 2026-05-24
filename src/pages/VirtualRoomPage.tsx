import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { CalendarPanel } from "../components/CalendarPanel";
import { ChatPanel } from "../components/ChatPanel";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { DecisionRoomPanel } from "../components/decision/DecisionRoomPanel";
import { Navbar } from "../components/Navbar";
import { PersonalRoomsPanel } from "../components/PersonalRoomsPanel";
import { PersonalRoomAccessAlerts } from "../components/PersonalRoomAccessAlerts";
import { PersonalRoomVisitPanel } from "../components/PersonalRoomVisitPanel";
import { MailboxNoteComposer } from "../components/mailbox/MailboxNoteComposer";
import { MailboxInboxPanel } from "../components/mailbox/MailboxInboxPanel";
import { MailboxSendAnimation } from "../components/mailbox/MailboxSendAnimation";
import { RoomNicknamesPanel } from "../components/RoomNicknamesPanel";
import { RoomSettingsPanel } from "../components/RoomSettingsPanel";
import { SuggestionsPanel } from "../components/SuggestionsPanel";
import { VirtualWorld } from "../components/VirtualWorld";
import { VoiceChatPanel } from "../components/VoiceChatPanel";
import { useApp } from "../context/AppContext";
import { useVoiceChat } from "../hooks/useVoiceChat";
import {
  livingVoiceChannelId,
  livingVoiceParticipants,
  personalVoiceChannelId,
  personalVoiceParticipants,
} from "../lib/voiceChannels";
import { playDoorbellSound } from "../lib/doorbellSound";
import { SUB_ROOMS, type SubRoomType } from "../types";

export function VirtualRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const {
    user,
    users,
    rooms,
    personalRoomAccess,
    ensureRoomSetup,
    leaveRoom,
    getRoomDisplayName,
    canEnterPersonalRoom,
    isApprovedPersonalRoom,
    enterPersonalRoomAsGuest,
    leavePersonalRoom,
    refresh,
    refreshPersonalRoomAccess,
    requestPersonalRoomAccess,
    sendMailboxNote,
    mailboxNotes,
  } = useApp();
  const [activeSubRoom, setActiveSubRoom] = useState<SubRoomType>("living");
  const [activePersonalOwner, setActivePersonalOwner] = useState<string | null>(null);
  const [sidebarVisitOwnerId, setSidebarVisitOwnerId] = useState<string | null>(null);
  const [ownMailboxOpen, setOwnMailboxOpen] = useState(false);
  const visitPinnedRef = useRef(false);
  const hoverSidebarTimerRef = useRef<number | null>(null);
  const [mailboxComposeOwnerId, setMailboxComposeOwnerId] = useState<string | null>(null);
  const [mailboxAnimation, setMailboxAnimation] = useState({
    active: false,
    envelopeColor: "#c4a574",
  });
  const [panelOpen, setPanelOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (roomId) ensureRoomSetup(roomId);
  }, [roomId, ensureRoomSetup]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refreshPersonalRoomAccess();
    }, 1500);
    return () => window.clearInterval(interval);
  }, [refreshPersonalRoomAccess]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refresh();
    }, 8000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const seenMailboxRef = useRef<Set<string>>(new Set());
  const mailboxSeededRef = useRef(false);

  useEffect(() => {
    if (!user || !roomId) return;
    const mine = mailboxNotes.filter((n) => n.roomId === roomId && n.ownerId === user.id);
    if (!mailboxSeededRef.current) {
      mine.forEach((n) => seenMailboxRef.current.add(n.id));
      mailboxSeededRef.current = true;
      return;
    }
    for (const note of mine) {
      if (seenMailboxRef.current.has(note.id)) continue;
      seenMailboxRef.current.add(note.id);
      if (!note.read) playDoorbellSound();
    }
  }, [mailboxNotes, roomId, user]);

  const room = rooms.find((r) => r.id === roomId);

  const displayMemberIds = useMemo(() => {
    if (!room) return [];
    return room.memberIds;
  }, [room]);

  const voiceContext = useMemo(() => {
    if (!room || !user) return null;

    if (activeSubRoom === "living") {
      return {
        channelId: livingVoiceChannelId(room.id),
        allowedParticipantIds: livingVoiceParticipants(displayMemberIds),
        title: "Living room voice",
        description: "Open to all room members. Join to talk with everyone in the living room.",
        unavailableMessage: undefined as string | undefined,
      };
    }

    if (activeSubRoom === "personal" && activePersonalOwner) {
      const canEnter = canEnterPersonalRoom(room.id, activePersonalOwner, user.id);
      const ownerName =
        getRoomDisplayName(room.id, activePersonalOwner) ||
        users.find((u) => u.id === activePersonalOwner)?.displayName ||
        "Member";
      return {
        channelId: personalVoiceChannelId(room.id, activePersonalOwner),
        allowedParticipantIds: personalVoiceParticipants(
          room.id,
          activePersonalOwner,
          personalRoomAccess
        ),
        title: `${ownerName}'s personal room voice`,
        description: "Private voice for the room owner and one approved guest.",
        unavailableMessage: canEnter
          ? undefined
          : "Request access and wait for approval before joining voice in this personal room.",
      };
    }

    return null;
  }, [
    activePersonalOwner,
    activeSubRoom,
    canEnterPersonalRoom,
    displayMemberIds,
    getRoomDisplayName,
    personalRoomAccess,
    room,
    user,
    users,
  ]);

  const participantNames = useMemo(() => {
    const names: Record<string, string> = {};
    if (!room) return names;
    for (const memberId of displayMemberIds) {
      names[memberId] =
        getRoomDisplayName(room.id, memberId) ||
        users.find((u) => u.id === memberId)?.displayName ||
        "Member";
    }
    if (user) {
      names[user.id] =
        getRoomDisplayName(room.id, user.id) || user.displayName || "You";
    }
    return names;
  }, [displayMemberIds, getRoomDisplayName, room, user, users]);

  const voice = useVoiceChat({
    channelId: voiceContext?.unavailableMessage ? null : (voiceContext?.channelId ?? null),
    userId: user?.id ?? "",
    allowedParticipantIds: voiceContext?.allowedParticipantIds ?? [],
  });

  const myUnreadMailboxCount = useMemo(() => {
    if (!user || !room) return 0;
    return mailboxNotes.filter(
      (n) => n.roomId === room.id && n.ownerId === user.id && !n.read
    ).length;
  }, [mailboxNotes, room, user]);

  const clearHoverSidebarTimer = () => {
    if (hoverSidebarTimerRef.current != null) {
      window.clearTimeout(hoverSidebarTimerRef.current);
      hoverSidebarTimerRef.current = null;
    }
  };

  useEffect(() => () => clearHoverSidebarTimer(), []);

  if (!user) return <Navigate to="/sign-in" replace />;

  if (!room || !room.memberIds.includes(user.id)) {
    return (
      <>
        <Navbar />
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <p>Room not found or you don&apos;t have access.</p>
          <Link to="/home" className="btn-primary mt-4 inline-block">
            Back to home
          </Link>
        </div>
      </>
    );
  }

  const subMeta = SUB_ROOMS.find((s) => s.id === activeSubRoom);
  const willDeleteRoom = room.memberIds.length <= 2;

  const mailboxRecipientName = mailboxComposeOwnerId
    ? getRoomDisplayName(room.id, mailboxComposeOwnerId) ||
      users.find((u) => u.id === mailboxComposeOwnerId)?.displayName ||
      "Friend"
    : "";

  const handleRingDoorbell = (ownerId: string) => {
    visitPinnedRef.current = true;
    clearHoverSidebarTimer();
    setSidebarVisitOwnerId(ownerId);
    setActiveSubRoom("personal");
    setActivePersonalOwner(ownerId);
    setPanelOpen(true);
    setSettingsOpen(false);
    const result = requestPersonalRoomAccess(room.id, ownerId);
    if (result.ok) playDoorbellSound();
    else if (result.error) alert(result.error);
  };

  const openOwnMailbox = () => {
    visitPinnedRef.current = true;
    clearHoverSidebarTimer();
    setSidebarVisitOwnerId(null);
    setOwnMailboxOpen(true);
    setActiveSubRoom("personal");
    setActivePersonalOwner(user.id);
    setPanelOpen(true);
    setSettingsOpen(false);
    for (const access of personalRoomAccess) {
      if (access.roomId === room.id && access.activeGuestId === user.id) {
        leavePersonalRoom(room.id, access.ownerId);
      }
    }
  };

  const handlePersonalRoomZoneEnter = (ownerId: string) => {
    setPanelOpen(true);
    setSettingsOpen(false);
    if (ownerId === user.id) {
      openOwnMailbox();
      return;
    }
    if (canEnterPersonalRoom(room.id, ownerId, user.id)) {
      enterPersonalRoomAsGuest(room.id, ownerId);
      handlePersonalRoomVisit(ownerId);
      return;
    }
    if (isApprovedPersonalRoom(room.id, ownerId, user.id)) {
      handlePersonalRoomVisit(ownerId);
      return;
    }
    handlePersonalRoomVisit(ownerId);
  };

  const handlePersonalRoomZoneLeave = (ownerId: string) => {
    if (ownerId !== user.id) {
      leavePersonalRoom(room.id, ownerId);
    }
  };

  const handlePersonalRoomVisit = (ownerId: string) => {
    visitPinnedRef.current = true;
    clearHoverSidebarTimer();
    setSidebarVisitOwnerId(ownerId);
    setOwnMailboxOpen(false);
    setActiveSubRoom("personal");
    setActivePersonalOwner(ownerId);
    setPanelOpen(true);
    setSettingsOpen(false);
  };

  const handlePersonalRoomHover = (ownerId: string) => {
    clearHoverSidebarTimer();
    if (!visitPinnedRef.current) {
      setSidebarVisitOwnerId(ownerId);
      setOwnMailboxOpen(false);
    }
    setPanelOpen(true);
    setSettingsOpen(false);
  };

  const hasPendingVisitRequest = (ownerId: string | null) => {
    if (!user || !ownerId) return false;
    const access = personalRoomAccess.find(
      (a) => a.roomId === room.id && a.ownerId === ownerId
    );
    return access?.pendingRequests.some((r) => r.userId === user.id) ?? false;
  };

  const handleClearPersonalRoomVisit = () => {
    if (hasPendingVisitRequest(sidebarVisitOwnerId)) return;
    visitPinnedRef.current = false;
    setSidebarVisitOwnerId(null);
  };

  const handlePersonalRoomHoverEnd = () => {
    clearHoverSidebarTimer();
    hoverSidebarTimerRef.current = window.setTimeout(() => {
      if (!visitPinnedRef.current && !hasPendingVisitRequest(sidebarVisitOwnerId)) {
        setSidebarVisitOwnerId(null);
      }
    }, 400);
  };

  const dismissSidebarVisit = () => {
    visitPinnedRef.current = false;
    setSidebarVisitOwnerId(null);
  };

  const confirmLeaveRoom = async () => {
    setLeaving(true);
    const result = await leaveRoom(room.id);
    setLeaving(false);
    setLeaveConfirmOpen(false);
    if (result.ok) {
      navigate("/home");
    }
  };

  const renderPanel = () => {
    switch (activeSubRoom) {
      case "calendar":
        return <CalendarPanel roomId={room.id} />;
      case "decision":
        return <DecisionRoomPanel roomId={room.id} />;
      case "suggestions":
        return <SuggestionsPanel roomId={room.id} />;
      case "personal":
        return (
          <PersonalRoomsPanel
            roomId={room.id}
            memberIds={displayMemberIds}
            selectedOwnerId={activePersonalOwner}
            onSelectOwner={setActivePersonalOwner}
            voiceContext={voiceContext}
            voice={voice}
            participantNames={participantNames}
            onOpenMailboxCompose={(ownerId) => {
              setMailboxComposeOwnerId(ownerId);
              setPanelOpen(true);
              setSettingsOpen(false);
            }}
            onRingDoorbell={handleRingDoorbell}
          />
        );
      default:
        return voiceContext ? (
          <VoiceChatPanel
            title={voiceContext.title}
            description={voiceContext.description}
            participantNames={participantNames}
            voice={voice}
            unavailableMessage={voiceContext.unavailableMessage}
          />
        ) : (
          <div className="p-4">
            <h3 className="font-semibold">Living / meeting room</h3>
            <p className="mt-2 text-sm text-cozy-600">
              Casual voice chat and hangouts. Walk to the living room or use the tab above.
            </p>
          </div>
        );
    }
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <Link to="/home" className="text-sm text-plum-600 hover:underline">
              ← All rooms
            </Link>
            <h1 className="font-display text-xl font-bold">{room.name}</h1>
            <p className="text-sm text-cozy-500">
              {subMeta?.label} — {subMeta?.description}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {SUB_ROOMS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setActiveSubRoom(s.id);
                  setPanelOpen(true);
                }}
                className={`rounded-lg px-3 py-1 text-xs font-medium ${
                  activeSubRoom === s.id
                    ? "bg-plum-600 text-white"
                    : "bg-cozy-200 text-cozy-800"
                }`}
              >
                {s.label.split(" ")[0]}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setSettingsOpen(!settingsOpen);
                setPanelOpen(true);
              }}
              className={`rounded-lg px-3 py-1 text-xs font-medium ${
                settingsOpen ? "bg-cozy-800 text-white" : "bg-cozy-200 text-cozy-800"
              }`}
            >
              Settings
            </button>
            <button
              type="button"
              onClick={() => setLeaveConfirmOpen(true)}
              className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
            >
              Leave room
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <VirtualWorld
              roomId={room.id}
              memberIds={displayMemberIds}
              area={room.area}
              activeSubRoom={activeSubRoom}
              activePersonalOwner={activePersonalOwner}
              onEnterSubRoom={(zone, ownerId) => {
                setActiveSubRoom(zone);
                setActivePersonalOwner(zone === "personal" ? ownerId ?? null : null);
                setPanelOpen(true);
                setSettingsOpen(false);
              }}
              onPersonalRoomVisit={handlePersonalRoomVisit}
              onPersonalRoomZoneEnter={handlePersonalRoomZoneEnter}
              onPersonalRoomZoneLeave={handlePersonalRoomZoneLeave}
              onClearPersonalRoomVisit={handleClearPersonalRoomVisit}
              onOpenOwnMailbox={openOwnMailbox}
              onPersonalRoomHover={handlePersonalRoomHover}
              onPersonalRoomHoverEnd={handlePersonalRoomHoverEnd}
              voiceContext={
                voiceContext && !voiceContext.unavailableMessage
                  ? {
                      title: voiceContext.title,
                      participantNames,
                      voice,
                    }
                  : null
              }
            />
            <div className="mt-4">
              <ChatPanel roomId={room.id} />
            </div>
          </div>

          <div className="card min-h-[200px] lg:col-span-1">
            <button
              type="button"
              className="mb-2 w-full text-left text-sm font-medium text-plum-600 lg:hidden"
              onClick={() => setPanelOpen(!panelOpen)}
            >
              {panelOpen ? "Hide" : "Show"} room tools
            </button>
            <div className={panelOpen ? "block" : "hidden lg:block"}>
              {settingsOpen ? (
                <div className="space-y-4">
                  <RoomSettingsPanel roomId={room.id} memberIds={displayMemberIds} />
                  <RoomNicknamesPanel roomId={room.id} memberIds={displayMemberIds} />
                  <div className="border-t border-cozy-100 pt-4">
                    <button
                      type="button"
                      className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                      onClick={() => setLeaveConfirmOpen(true)}
                    >
                      Leave room
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-3 flex items-center justify-between gap-2 border-b border-cozy-100 pb-2">
                    <button
                      type="button"
                      className="text-xs font-semibold text-sky-800 underline"
                      onClick={openOwnMailbox}
                    >
                      📬 Your mailbox
                      {myUnreadMailboxCount > 0 ? ` (${myUnreadMailboxCount} new)` : ""}
                    </button>
                  </div>
                  {myUnreadMailboxCount > 0 && (
                    <div className="mb-3 rounded-xl border-2 border-sky-300 bg-sky-50 p-3">
                      <p className="text-sm font-semibold text-cozy-900">
                        📬 {myUnreadMailboxCount} new note
                        {myUnreadMailboxCount === 1 ? "" : "s"} in your mailbox
                      </p>
                      <button
                        type="button"
                        className="btn-primary mt-2 text-xs"
                        onClick={openOwnMailbox}
                      >
                        Open mailbox
                      </button>
                    </div>
                  )}
                  <PersonalRoomAccessAlerts
                    roomId={room.id}
                    onNewDoorbell={() => {
                      setPanelOpen(true);
                      setSettingsOpen(false);
                    }}
                  />
                  {ownMailboxOpen && (
                    <div className="mb-3 rounded-xl border border-sky-200 bg-sky-50/50 p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-sky-800">
                          Your mailbox
                        </p>
                        <button
                          type="button"
                          className="text-xs text-cozy-500 underline"
                          onClick={() => setOwnMailboxOpen(false)}
                        >
                          Close
                        </button>
                      </div>
                      <MailboxInboxPanel roomId={room.id} ownerId={user.id} />
                    </div>
                  )}
                  <div
                    onMouseEnter={clearHoverSidebarTimer}
                    onMouseLeave={handlePersonalRoomHoverEnd}
                  >
                    {sidebarVisitOwnerId && sidebarVisitOwnerId !== user.id && (
                      <PersonalRoomVisitPanel
                        roomId={room.id}
                        ownerId={sidebarVisitOwnerId}
                        onDismiss={dismissSidebarVisit}
                        onOpenMailboxCompose={(ownerId) => {
                          visitPinnedRef.current = true;
                          setMailboxComposeOwnerId(ownerId);
                          setPanelOpen(true);
                          setSettingsOpen(false);
                        }}
                        onRingDoorbell={handleRingDoorbell}
                        onEnterRoom={(ownerId) => {
                          setActiveSubRoom("personal");
                          setActivePersonalOwner(ownerId);
                          visitPinnedRef.current = true;
                        }}
                      />
                    )}
                  </div>
                  {mailboxComposeOwnerId && (
                    <>
                      {mailboxComposeOwnerId !== user.id && (
                        <p className="mb-2 text-xs font-medium text-sky-700">
                          Writing to {mailboxRecipientName}&apos;s mailbox
                        </p>
                      )}
                      <div className="mb-3">
                        <MailboxNoteComposer
                          recipientName={mailboxRecipientName}
                          onCancel={() => setMailboxComposeOwnerId(null)}
                          onSend={async (payload) => {
                            const result = await sendMailboxNote({
                              roomId: room.id,
                              ownerId: mailboxComposeOwnerId,
                              ...payload,
                            });
                            if (result.ok) {
                              playDoorbellSound();
                              setMailboxAnimation({
                                active: true,
                                envelopeColor: payload.envelopeColor,
                              });
                              setMailboxComposeOwnerId(null);
                            }
                            return result;
                          }}
                        />
                      </div>
                    </>
                  )}
                  {renderPanel()}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <MailboxSendAnimation
        active={mailboxAnimation.active}
        envelopeColor={mailboxAnimation.envelopeColor}
        onComplete={() => setMailboxAnimation((s) => ({ ...s, active: false }))}
      />

      <ConfirmDialog
        open={leaveConfirmOpen}
        title="Leave room?"
        message={
          willDeleteRoom
            ? "Are you sure you want to leave this room? The room will be deleted because only one member would remain."
            : "Are you sure you want to leave this room? You can rejoin if another member invites you."
        }
        confirmLabel="Leave room"
        danger
        loading={leaving}
        onConfirm={() => void confirmLeaveRoom()}
        onCancel={() => !leaving && setLeaveConfirmOpen(false)}
      />
    </>
  );
}
