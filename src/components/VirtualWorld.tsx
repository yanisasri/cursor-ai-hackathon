import { useCallback, useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { AvatarPreview } from "./AvatarPreview";
import type { SubRoomType } from "../types";

interface Props {
  roomId: string;
  area: string;
  activeSubRoom: SubRoomType;
  onEnterSubRoom: (zone: SubRoomType) => void;
}

interface Player {
  id: string;
  x: number;
  y: number;
  name: string;
}

const WORLD_W = 640;
const WORLD_H = 480;
const SPEED = 4;

const ZONES: { type: SubRoomType; x: number; y: number; w: number; h: number; color: string; label: string }[] = [
  { type: "living", x: 40, y: 40, w: 160, h: 120, color: "#e8d5f2", label: "Living" },
  { type: "calendar", x: 240, y: 40, w: 160, h: 120, color: "#d8f3dc", label: "Calendar" },
  { type: "decision", x: 440, y: 40, w: 160, h: 120, color: "#fde8e8", label: "Decisions" },
  { type: "suggestions", x: 120, y: 280, w: 180, h: 120, color: "#fff3cd", label: "Ideas" },
  { type: "personal", x: 360, y: 280, w: 180, h: 120, color: "#e0e7ff", label: "Personal" },
];

const areaBg: Record<string, string> = {
  house: "#f3ebe0",
  office: "#e8eef5",
  cafe: "#f5e6d3",
  park: "#e8f5e9",
};

export function VirtualWorld({ area, activeSubRoom, onEnterSubRoom }: Props) {
  const { user, users } = useApp();
  const [pos, setPos] = useState({ x: 300, y: 220 });
  const [others, setOthers] = useState<Player[]>([]);
  const [voiceOn, setVoiceOn] = useState(false);
  const [knockPending, setKnockPending] = useState(false);
  const [personalOpen, setPersonalOpen] = useState(false);

  useEffect(() => {
    const demo: Player[] = users
      .filter((u) => u.id !== user?.id)
      .slice(0, 3)
      .map((u, i) => ({
        id: u.id,
        x: 180 + i * 60,
        y: 180 + i * 30,
        name: u.displayName,
      }));
    setOthers(demo);
  }, [users, user]);

  const move = useCallback((dx: number, dy: number) => {
    setPos((p) => ({
      x: Math.max(20, Math.min(WORLD_W - 40, p.x + dx)),
      y: Math.max(20, Math.min(WORLD_H - 40, p.y + dy)),
    }));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      switch (e.key.toLowerCase()) {
        case "w":
        case "arrowup":
          move(0, -SPEED);
          break;
        case "s":
        case "arrowdown":
          move(0, SPEED);
          break;
        case "a":
        case "arrowleft":
          move(-SPEED, 0);
          break;
        case "d":
        case "arrowright":
          move(SPEED, 0);
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move]);

  useEffect(() => {
    for (const z of ZONES) {
      if (
        pos.x >= z.x &&
        pos.x <= z.x + z.w &&
        pos.y >= z.y &&
        pos.y <= z.y + z.h
      ) {
        if (z.type === "personal" && !personalOpen) {
          if (!knockPending) setKnockPending(true);
        } else if (z.type !== "personal") {
          onEnterSubRoom(z.type);
          setKnockPending(false);
        }
        return;
      }
    }
  }, [pos, onEnterSubRoom, personalOpen, knockPending]);

  const requestEnterPersonal = () => {
    setKnockPending(false);
    setPersonalOpen(true);
    onEnterSubRoom("personal");
  };

  return (
    <div className="space-y-3">
      <div
        className="relative mx-auto overflow-hidden rounded-2xl border-4 border-cozy-300 shadow-inner"
        style={{ width: WORLD_W, maxWidth: "100%", height: WORLD_H, background: areaBg[area] ?? "#f3ebe0" }}
      >
        <div className="absolute inset-0 opacity-30">
          {Array.from({ length: 8 }).map((_, row) =>
            Array.from({ length: 10 }).map((_, col) => (
              <div
                key={`${row}-${col}`}
                className="absolute border border-cozy-400/30"
                style={{
                  left: col * 64,
                  top: row * 60,
                  width: 64,
                  height: 60,
                }}
              />
            ))
          )}
        </div>

        {ZONES.map((z) => (
          <button
            key={z.type}
            type="button"
            onClick={() => {
              if (z.type === "personal") {
                setKnockPending(true);
              } else {
                onEnterSubRoom(z.type);
              }
            }}
            className={`absolute rounded-xl border-2 border-cozy-400/50 transition hover:brightness-95 ${
              activeSubRoom === z.type ? "ring-4 ring-plum-500" : ""
            }`}
            style={{
              left: z.x,
              top: z.y,
              width: z.w,
              height: z.h,
              backgroundColor: z.color,
            }}
          >
            <span className="text-xs font-semibold text-cozy-800">{z.label}</span>
          </button>
        ))}

        {others.map((o) => (
          <div
            key={o.id}
            className="absolute flex flex-col items-center"
            style={{ left: o.x, top: o.y, transform: "translate(-50%, -50%)" }}
          >
            <div className="h-8 w-8 rounded-full bg-cozy-400" />
            <span className="text-[10px] font-medium">{o.name}</span>
          </div>
        ))}

        {user && (
          <div
            className="absolute z-10 flex flex-col items-center transition-all duration-75"
            style={{ left: pos.x, top: pos.y, transform: "translate(-50%, -80%)" }}
          >
            <AvatarPreview avatar={user.avatar} size="sm" label={user.displayName} />
          </div>
        )}

        {knockPending && !personalOpen && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="card text-center">
              <p className="font-medium">Personal room</p>
              <p className="mt-1 text-sm text-cozy-600">Request to enter this private space?</p>
              <div className="mt-3 flex justify-center gap-2">
                <button type="button" className="btn-secondary text-sm" onClick={() => setKnockPending(false)}>
                  Cancel
                </button>
                <button type="button" className="btn-primary text-sm" onClick={requestEnterPersonal}>
                  Request to enter
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <p className="w-full text-center text-xs text-cozy-500">
          Move with WASD or arrow keys · Walk into a zone or click it
        </p>
        {(["w", "a", "s", "d"] as const).map((k) => (
          <button
            key={k}
            type="button"
            className="rounded-lg bg-cozy-200 px-4 py-2 font-mono text-sm uppercase hover:bg-cozy-300"
            onClick={() => {
              if (k === "w") move(0, -SPEED);
              if (k === "s") move(0, SPEED);
              if (k === "a") move(-SPEED, 0);
              if (k === "d") move(SPEED, 0);
            }}
          >
            {k === "w" ? "↑" : k === "s" ? "↓" : k === "a" ? "←" : "→"}
          </button>
        ))}
        <button
          type="button"
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            voiceOn ? "bg-green-600 text-white" : "bg-cozy-200"
          }`}
          onClick={() => setVoiceOn(!voiceOn)}
        >
          {voiceOn ? "Voice: On (demo)" : "Voice: Off"}
        </button>
      </div>
    </div>
  );
}
