import { useCallback, useEffect, useRef, useState } from "react";
import { getVelocityFromHeldKeys, useHeldKeys } from "../hooks/useHeldKeys";
import { useApp } from "../context/AppContext";
import { AvatarPreview } from "./AvatarPreview";
import { DEFAULT_AVATAR, getDisplayAvatar, type SubRoomType } from "../types";

interface Props {
  roomId: string;
  memberIds: string[];
  area: string;
  activeSubRoom: SubRoomType;
  onEnterSubRoom: (zone: SubRoomType, ownerId?: string) => void;
}

interface Player {
  id: string;
  x: number;
  y: number;
  name: string;
}

const WORLD_W = 640;
const WORLD_H = 480;
const SPEED = 3.5;

const ZONES: {
  type: SubRoomType;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  label: string;
}[] = [
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

function zoneCenter(z: (typeof ZONES)[0]) {
  return { x: z.x + z.w / 2, y: z.y + z.h / 2 };
}

export function VirtualWorld({
  roomId,
  memberIds,
  area,
  activeSubRoom,
  onEnterSubRoom,
}: Props) {
  const { user, users, getRoomDisplayName } = useApp();
  const [pos, setPos] = useState({ x: 300, y: 220 });
  const [target, setTarget] = useState<{ x: number; y: number } | null>(null);
  const [others, setOthers] = useState<Player[]>([]);
  const [voiceOn, setVoiceOn] = useState(false);
  const heldKeysRef = useHeldKeys(true);
  const lastZoneRef = useRef<SubRoomType | null>(null);

  useEffect(() => {
    const members = memberIds.filter((id) => id !== user?.id);
    setOthers(
      members.map((id, i) => {
        const u = users.find((x) => x.id === id);
        const angle = (i / Math.max(members.length, 1)) * Math.PI * 2;
        return {
          id,
          x: 300 + Math.cos(angle) * 80,
          y: 200 + Math.sin(angle) * 60,
          name: getRoomDisplayName(roomId, id) || u?.displayName || "Friend",
        };
      })
    );
  }, [memberIds, users, user, roomId, getRoomDisplayName]);

  const clamp = useCallback(
    (x: number, y: number) => ({
      x: Math.max(24, Math.min(WORLD_W - 24, x)),
      y: Math.max(24, Math.min(WORLD_H - 24, y)),
    }),
    []
  );

  useEffect(() => {
    let frame: number;
    const tick = () => {
      setPos((p) => {
        let { x, y } = p;

        if (target) {
          const dx = target.x - x;
          const dy = target.y - y;
          const dist = Math.hypot(dx, dy);
          if (dist < SPEED * 1.5) {
            setTarget(null);
            return clamp(target.x, target.y);
          }
          x += (dx / dist) * SPEED;
          y += (dy / dist) * SPEED;
          return clamp(x, y);
        }

        const { dx, dy } = getVelocityFromHeldKeys(heldKeysRef.current, SPEED);
        if (dx !== 0 || dy !== 0) {
          return clamp(x + dx, y + dy);
        }
        return p;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, clamp, heldKeysRef]);

  useEffect(() => {
    for (const z of ZONES) {
      if (
        pos.x >= z.x &&
        pos.x <= z.x + z.w &&
        pos.y >= z.y &&
        pos.y <= z.y + z.h
      ) {
        if (lastZoneRef.current !== z.type) {
          lastZoneRef.current = z.type;
          if (z.type === "personal") {
            onEnterSubRoom("personal");
          } else {
            onEnterSubRoom(z.type);
          }
        }
        return;
      }
    }
    lastZoneRef.current = null;
  }, [pos, onEnterSubRoom]);

  const goToZone = (z: (typeof ZONES)[0]) => {
    const c = zoneCenter(z);
    setTarget(c);
    if (z.type !== "personal") {
      onEnterSubRoom(z.type);
    } else {
      onEnterSubRoom("personal");
    }
  };

  return (
    <div className="space-y-3">
      <div
        className="relative mx-auto overflow-hidden rounded-2xl border-4 border-cozy-300 shadow-inner"
        style={{
          width: WORLD_W,
          maxWidth: "100%",
          height: WORLD_H,
          background: areaBg[area] ?? "#f3ebe0",
        }}
      >
        <div className="absolute inset-0 opacity-25">
          {Array.from({ length: 8 }).map((_, row) =>
            Array.from({ length: 10 }).map((_, col) => (
              <div
                key={`${row}-${col}`}
                className="absolute border border-cozy-400/30"
                style={{ left: col * 64, top: row * 60, width: 64, height: 60 }}
              />
            ))
          )}
        </div>

        {ZONES.map((z) => (
          <button
            key={z.type}
            type="button"
            onClick={() => goToZone(z)}
            className={`absolute rounded-xl border-2 border-cozy-400/50 transition hover:brightness-95 hover:ring-2 hover:ring-plum-400 ${
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
            <span className="text-xs font-bold text-cozy-800">{z.label}</span>
            <span className="mt-1 block text-[10px] text-cozy-600">Click to walk here</span>
          </button>
        ))}

        {others.map((o) => {
          const member = users.find((u) => u.id === o.id);
          const avatar = member ? getDisplayAvatar(member) : DEFAULT_AVATAR;
          return (
            <div
              key={o.id}
              className="absolute z-[5] flex flex-col items-center pointer-events-none"
              style={{
                left: o.x,
                top: o.y,
                transform: "translate(-50%, -85%)",
              }}
            >
              <AvatarPreview avatar={avatar} size="sm" label={o.name} />
            </div>
          );
        })}

        {user && (
          <div
            className="absolute z-10 flex flex-col items-center"
            style={{
              left: pos.x,
              top: pos.y,
              transform: "translate(-50%, -88%)",
            }}
          >
            <AvatarPreview
              avatar={getDisplayAvatar(user)}
              size="sm"
              label={getRoomDisplayName(roomId, user.id)}
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <p className="w-full text-center text-xs text-cozy-500">
          Hold WASD or arrow keys to move · Click a room to walk there automatically
        </p>
        {(["w", "a", "s", "d"] as const).map((k) => (
          <button
            key={k}
            type="button"
            className="select-none rounded-lg bg-cozy-200 px-4 py-2 font-mono text-sm uppercase active:bg-plum-200"
            onMouseDown={() => heldKeysRef.current.add(k)}
            onMouseUp={() => heldKeysRef.current.delete(k)}
            onMouseLeave={() => heldKeysRef.current.delete(k)}
            onTouchStart={() => heldKeysRef.current.add(k)}
            onTouchEnd={() => heldKeysRef.current.delete(k)}
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
