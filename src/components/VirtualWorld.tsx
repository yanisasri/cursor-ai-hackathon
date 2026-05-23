import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

const BASE_ZONES: {
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
  { type: "suggestions", x: 130, y: 190, w: 200, h: 105, color: "#fff3cd", label: "Ideas" },
];

const areaBg: Record<string, string> = {
  house: "#f3ebe0",
  office: "#e8eef5",
  cafe: "#f5e6d3",
  park: "#e8f5e9",
};

function zoneCenter(z: { x: number; y: number; w: number; h: number }) {
  return { x: z.x + z.w / 2, y: z.y + z.h / 2 };
}

function AreaFurniture({ area }: { area: string }) {
  if (area === "office") {
    return (
      <>
        <rect x="20" y="20" width="120" height="70" rx="10" fill="#d9e2ec" />
        <rect x="35" y="35" width="90" height="30" rx="6" fill="#9fb3c8" />
        <rect x="500" y="24" width="110" height="80" rx="8" fill="#c3d4e6" />
        <rect x="522" y="42" width="66" height="24" rx="4" fill="#7f95ad" />
        <rect x="280" y="350" width="88" height="54" rx="8" fill="#b0beca" />
        <circle cx="310" cy="332" r="18" fill="#9fb3c8" />
      </>
    );
  }
  if (area === "cafe") {
    return (
      <>
        <circle cx="85" cy="78" r="28" fill="#e8c39e" />
        <circle cx="85" cy="78" r="14" fill="#fff4e6" />
        <circle cx="555" cy="84" r="30" fill="#e8c39e" />
        <circle cx="555" cy="84" r="16" fill="#fff4e6" />
        <rect x="250" y="18" width="140" height="50" rx="12" fill="#d1a67a" />
        <rect x="260" y="26" width="120" height="16" rx="6" fill="#f8ede3" />
        <rect x="246" y="330" width="148" height="74" rx="8" fill="#c28f62" />
      </>
    );
  }
  if (area === "park") {
    return (
      <>
        <circle cx="64" cy="54" r="28" fill="#74c69d" />
        <rect x="58" y="72" width="12" height="34" fill="#588157" />
        <circle cx="570" cy="56" r="26" fill="#74c69d" />
        <rect x="564" y="72" width="12" height="34" fill="#588157" />
        <ellipse cx="320" cy="430" rx="120" ry="36" fill="#95d5b2" />
        <rect x="220" y="96" width="56" height="14" rx="6" fill="#8d6e63" />
        <rect x="360" y="96" width="56" height="14" rx="6" fill="#8d6e63" />
      </>
    );
  }
  return (
    <>
      <rect x="26" y="22" width="138" height="84" rx="10" fill="#d8c3a5" />
      <rect x="48" y="40" width="94" height="48" rx="8" fill="#c49a74" />
      <rect x="480" y="26" width="130" height="74" rx="10" fill="#d4b89a" />
      <rect x="510" y="46" width="70" height="36" rx="6" fill="#f8f1e4" />
      <rect x="244" y="336" width="156" height="80" rx="10" fill="#ccb08e" />
      <rect x="272" y="356" width="100" height="40" rx="8" fill="#b08968" />
    </>
  );
}

export function VirtualWorld({
  roomId,
  memberIds,
  area,
  activeSubRoom,
  onEnterSubRoom,
}: Props) {
  const {
    user,
    users,
    getRoomDisplayName,
    canEnterPersonalRoom,
    requestPersonalRoomAccess,
  } = useApp();
  const [pos, setPos] = useState({ x: 300, y: 220 });
  const [target, setTarget] = useState<{ x: number; y: number } | null>(null);
  const [personalPromptOwnerId, setPersonalPromptOwnerId] = useState<string | null>(null);
  const [others, setOthers] = useState<Player[]>([]);
  const [voiceOn, setVoiceOn] = useState(false);
  const heldKeysRef = useHeldKeys(true);
  const lastZoneRef = useRef<string | null>(null);

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

  const personalZones = useMemo(() => {
    const cols = Math.min(4, Math.max(1, memberIds.length));
    const rows = Math.ceil(memberIds.length / 4);
    const zoneW = 130;
    const zoneH = 80;
    const gap = 12;
    const totalW = cols * zoneW + (cols - 1) * gap;
    const startX = Math.max(20, (WORLD_W - totalW) / 2);
    const startY = rows > 1 ? 320 : 342;

    return memberIds.map((ownerId, index) => {
      const col = index % 4;
      const row = Math.floor(index / 4);
      return {
        ownerId,
        type: "personal" as const,
        x: startX + col * (zoneW + gap),
        y: startY + row * (zoneH + gap),
        w: zoneW,
        h: zoneH,
        color: ownerId === user?.id ? "#dbeafe" : "#e0e7ff",
        label: `${getRoomDisplayName(roomId, ownerId)}'s Room`,
      };
    });
  }, [memberIds, user, roomId, getRoomDisplayName]);

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
    const zones = [...BASE_ZONES, ...personalZones];
    for (const z of zones) {
      if (
        pos.x >= z.x &&
        pos.x <= z.x + z.w &&
        pos.y >= z.y &&
        pos.y <= z.y + z.h
      ) {
        const zoneKey =
          z.type === "personal" && "ownerId" in z ? `personal:${z.ownerId}` : z.type;
        if (lastZoneRef.current !== zoneKey) {
          lastZoneRef.current = zoneKey;
          if (z.type === "personal" && "ownerId" in z) {
            const ownerId = String(z.ownerId ?? "");
            if (!ownerId) return;
            onEnterSubRoom("personal", ownerId);
            if (user && ownerId !== user.id && !canEnterPersonalRoom(roomId, ownerId, user.id)) {
              setPersonalPromptOwnerId(ownerId);
            } else {
              setPersonalPromptOwnerId(null);
            }
          } else {
            onEnterSubRoom(z.type);
            setPersonalPromptOwnerId(null);
          }
        }
        return;
      }
    }
    lastZoneRef.current = null;
    setPersonalPromptOwnerId(null);
  }, [pos, onEnterSubRoom, personalZones, canEnterPersonalRoom, roomId, user]);

  const goToZone = (z: {
    type: SubRoomType;
    x: number;
    y: number;
    w: number;
    h: number;
    ownerId?: string;
  }) => {
    const c = zoneCenter(z);
    setTarget(c);
    if (z.type !== "personal") {
      onEnterSubRoom(z.type);
    } else {
      onEnterSubRoom("personal", z.ownerId);
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
        <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}>
          <rect x="0" y="0" width={WORLD_W} height={WORLD_H} fill="rgba(255,255,255,0.12)" />
          <rect x="12" y="12" width="616" height="456" rx="18" fill="none" stroke="#7d5a42" strokeWidth="6" />
          <line x1="210" y1="12" x2="210" y2="130" stroke="#7d5a42" strokeWidth="6" />
          <line x1="430" y1="12" x2="430" y2="130" stroke="#7d5a42" strokeWidth="6" />
          <line x1="12" y1="310" x2="628" y2="310" stroke="#7d5a42" strokeWidth="6" />
          <line x1="12" y1="150" x2="140" y2="150" stroke="#7d5a42" strokeWidth="6" />
          <line x1="500" y1="150" x2="628" y2="150" stroke="#7d5a42" strokeWidth="6" />
          <line x1="320" y1="310" x2="320" y2="468" stroke="#7d5a42" strokeWidth="6" />
          <AreaFurniture area={area} />
          <rect x="228" y="274" width="190" height="22" rx="8" fill="#ffffff66" />
          <text x="245" y="289" fontSize="12" fill="#5f4b3a">Hallway</text>
        </svg>

        <div className="pointer-events-none absolute inset-0 opacity-12">
          {Array.from({ length: 8 }).map((_, row) =>
            Array.from({ length: 10 }).map((_, col) => (
              <div
                key={`${row}-${col}`}
                className="absolute border border-cozy-700/30"
                style={{ left: col * 64, top: row * 60, width: 64, height: 60 }}
              />
            ))
          )}
        </div>

        {BASE_ZONES.map((z) => (
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

        {personalZones.map((z) => {
          const member = users.find((u) => u.id === z.ownerId);
          const avatar = member ? getDisplayAvatar(member) : DEFAULT_AVATAR;
          return (
            <button
              key={`personal-${z.ownerId}`}
              type="button"
              onClick={() => goToZone(z)}
              className={`absolute overflow-hidden rounded-xl border-2 border-indigo-200 transition hover:brightness-95 hover:ring-2 hover:ring-indigo-300 ${
                activeSubRoom === "personal" ? "ring-2 ring-plum-500" : ""
              }`}
              style={{
                left: z.x,
                top: z.y,
                width: z.w,
                height: z.h,
                backgroundColor: z.color,
              }}
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/40 to-indigo-100/20" />
              <div className="relative z-10 flex h-full items-center gap-2 px-2">
                <AvatarPreview avatar={avatar} size="sm" />
                <div className="min-w-0 text-left">
                  <p className="truncate text-[11px] font-bold text-indigo-900">
                    {getRoomDisplayName(roomId, z.ownerId)}
                  </p>
                  <p className="text-[10px] text-indigo-700">Personal room</p>
                </div>
              </div>
            </button>
          );
        })}

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

        {personalPromptOwnerId && user && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/35">
            <div className="card w-full max-w-sm text-center">
              <p className="font-semibold text-cozy-900">
                {getRoomDisplayName(roomId, personalPromptOwnerId)}'s personal room
              </p>
              <p className="mt-2 text-sm text-cozy-600">
                You need access to enter this private room.
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <button
                  type="button"
                  className="btn-secondary text-sm"
                  onClick={() => setPersonalPromptOwnerId(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn-primary text-sm"
                  onClick={() => {
                    requestPersonalRoomAccess(roomId, personalPromptOwnerId);
                    setPersonalPromptOwnerId(null);
                  }}
                >
                  Request to enter
                </button>
              </div>
            </div>
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
