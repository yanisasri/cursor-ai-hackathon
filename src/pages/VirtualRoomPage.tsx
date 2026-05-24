import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { CalendarPanel } from "../components/CalendarPanel";
import { ChatPanel } from "../components/ChatPanel";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { DecisionRoomPanel } from "../components/decision/DecisionRoomPanel";
import { Navbar } from "../components/Navbar";
import { PersonalRoomsPanel } from "../components/PersonalRoomsPanel";
import { RoomNicknamesPanel } from "../components/RoomNicknamesPanel";
import { RoomSettingsPanel } from "../components/RoomSettingsPanel";
import { SuggestionsPanel } from "../components/SuggestionsPanel";
import { VirtualWorld } from "../components/VirtualWorld";
import { useApp } from "../context/AppContext";
import { SUB_ROOMS, type SubRoomType } from "../types";

export function VirtualRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user, rooms, ensureRoomSetup, leaveRoom } = useApp();
  const [activeSubRoom, setActiveSubRoom] = useState<SubRoomType>("living");
  const [activePersonalOwner, setActivePersonalOwner] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (roomId) ensureRoomSetup(roomId);
  }, [roomId, ensureRoomSetup]);

  const room = rooms.find((r) => r.id === roomId);

  const displayMemberIds = useMemo(() => {
    if (!room) return [];
    return room.memberIds;
  }, [room]);

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
          />
        );
      default:
        return (
          <div className="p-4">
            <h3 className="font-semibold">Living / meeting room</h3>
            <p className="mt-2 text-sm text-cozy-600">
              Casual voice chat and hangouts. Toggle voice on the map below.
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
                renderPanel()
              )}
            </div>
          </div>
        </div>
      </main>

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
