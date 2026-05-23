import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { CalendarPanel } from "../components/CalendarPanel";
import { ChatPanel } from "../components/ChatPanel";
import { DecisionRoomPanel } from "../components/decision/DecisionRoomPanel";
import { Navbar } from "../components/Navbar";
import { SuggestionsPanel } from "../components/SuggestionsPanel";
import { VirtualWorld } from "../components/VirtualWorld";
import { useApp } from "../context/AppContext";
import { SUB_ROOMS, type SubRoomType } from "../types";

export function VirtualRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { user, rooms } = useApp();
  const [activeSubRoom, setActiveSubRoom] = useState<SubRoomType>("living");
  const [panelOpen, setPanelOpen] = useState(false);

  if (!user) return <Navigate to="/sign-in" replace />;

  const room = rooms.find((r) => r.id === roomId);
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
          <div className="p-4">
            <h3 className="font-semibold">Personal room</h3>
            <p className="mt-2 text-sm text-cozy-600">
              You&apos;re in a private space. Others must request to enter. Use voice
              chat for 1:1 conversations (demo toggle on the map).
            </p>
          </div>
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
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <VirtualWorld
              roomId={room.id}
              area={room.area}
              activeSubRoom={activeSubRoom}
              onEnterSubRoom={(zone) => {
                setActiveSubRoom(zone);
                setPanelOpen(true);
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
              {renderPanel()}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
