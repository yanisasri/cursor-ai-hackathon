import { AvatarPreview } from "./AvatarPreview";
import {
  BASE_WORLD_H,
  CORRIDOR_AVATAR_SLOTS,
  HouseDefs,
  HouseStaticRooms,
  PersonalRoomSVG,
  PERSONAL_COLS,
  PERSONAL_GAP,
  PERSONAL_START_Y,
  PERSONAL_ZONE_H,
  PERSONAL_ZONE_W,
  WORLD_W,
} from "./VirtualWorld";
import { DEFAULT_AVATAR, SUB_ROOMS } from "../types";

const DEMO_MEMBERS = [
  { name: "Alex", nickname: "Al", avatar: DEFAULT_AVATAR, presence: "online" as const },
  {
    name: "Jordan",
    nickname: "J",
    avatar: {
      ...DEFAULT_AVATAR,
      seed: "demo-jordan",
      hairIndex: 22,
      hairColor: "#2c1810",
      skinTone: "#e8b796",
      glassesIndex: 2,
    },
    presence: "online" as const,
  },
  {
    name: "Sam",
    nickname: "Sammy",
    avatar: {
      ...DEFAULT_AVATAR,
      seed: "demo-sam",
      hairIndex: 8,
      hairColor: "#c49a6c",
      skinTone: "#d4a574",
      freckles: true,
    },
    presence: "idle" as const,
  },
  {
    name: "Riley",
    nickname: "Ri",
    avatar: {
      ...DEFAULT_AVATAR,
      seed: "demo-riley",
      hairIndex: 35,
      hairColor: "#1a1a1a",
      skinTone: "#8d5524",
      earringsIndex: 1,
    },
    presence: "offline" as const,
  },
];

const PRESENCE_DOT = {
  online: "bg-green-500",
  idle: "bg-amber-400",
  offline: "bg-cozy-300",
};

function personalZones(count: number) {
  const cols = Math.min(PERSONAL_COLS, Math.max(1, count));
  const totalW = cols * PERSONAL_ZONE_W + (cols - 1) * PERSONAL_GAP;
  const startX = Math.max(16, (WORLD_W - totalW) / 2);

  return Array.from({ length: count }, (_, index) => {
    const col = index % PERSONAL_COLS;
    const row = Math.floor(index / PERSONAL_COLS);
    return {
      x: startX + col * (PERSONAL_ZONE_W + PERSONAL_GAP),
      y: PERSONAL_START_Y + row * (PERSONAL_ZONE_H + PERSONAL_GAP),
      w: PERSONAL_ZONE_W,
      h: PERSONAL_ZONE_H,
    };
  });
}

function PreviewWorldMap() {
  const worldH = BASE_WORLD_H;
  const zones = personalZones(DEMO_MEMBERS.length);

  return (
    <div
      className="relative mx-auto w-full overflow-hidden rounded-xl border-4 border-cozy-300 shadow-inner"
      style={{ aspectRatio: `${WORLD_W} / ${worldH}`, background: "#b87040" }}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${WORLD_W} ${worldH}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <HouseDefs />
        <HouseStaticRooms worldH={worldH} />
        {zones.map((z, i) => {
          const member = DEMO_MEMBERS[i];
          return (
            <PersonalRoomSVG
              key={member.name}
              x={z.x}
              y={z.y}
              w={z.w}
              h={z.h}
              isOwner={i === 0}
              displayName={member.nickname}
              username={member.name}
              statusLabel={i === 0 ? "Your room" : "Tap to enter"}
            />
          );
        })}
      </svg>

      {/* Active living room highlight */}
      <div
        className="pointer-events-none absolute rounded-xl ring-4 ring-plum-500/70 shadow-[0_0_22px_8px_rgba(147,51,234,0.28)]"
        style={{
          left: `${(40 / WORLD_W) * 100}%`,
          top: `${(40 / worldH) * 100}%`,
          width: `${(160 / WORLD_W) * 100}%`,
          height: `${(120 / worldH) * 100}%`,
        }}
      />

      {/* Avatars in hallway */}
      {DEMO_MEMBERS.map((member, i) => {
        const slot = CORRIDOR_AVATAR_SLOTS[i];
        return (
          <div
            key={member.name}
            className="pointer-events-none absolute z-10 flex flex-col items-center"
            style={{
              left: `${(slot.x / WORLD_W) * 100}%`,
              top: `${(slot.y / worldH) * 100}%`,
              transform: "translate(-50%, -88%)",
            }}
          >
            <div className="relative rounded-full bg-white/90 p-0.5 shadow-md ring-2 ring-white">
              <AvatarPreview avatar={member.avatar} size="sm" scale={0.85} />
              <span
                className={`absolute bottom-0 right-0 h-2 w-2 rounded-full ring-2 ring-white ${PRESENCE_DOT[member.presence]}`}
              />
            </div>
            <span className="mt-0.5 max-w-[52px] truncate rounded bg-white/85 px-1 text-[8px] font-medium text-cozy-700 shadow-sm">
              {member.nickname}
            </span>
          </div>
        );
      })}

      {/* Voice toggle hint */}
      <div className="absolute bottom-2 right-2 rounded-lg bg-white/90 px-2 py-1 text-[9px] font-medium text-plum-700 shadow">
        🎙️ Voice on
      </div>
    </div>
  );
}

export function LandingAppPreview() {
  return (
    <div className="mx-auto mt-12 max-w-5xl">
      <div className="overflow-hidden rounded-2xl border border-white/25 bg-white shadow-2xl">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b border-cozy-200 bg-cozy-100 px-4 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="ml-3 flex-1 rounded-md bg-white px-3 py-1 text-xs text-cozy-500">
            hangout-hub.vercel.app/room/cozy-cafe
          </span>
        </div>

        {/* App navbar */}
        <div className="flex items-center justify-between border-b border-cozy-200 bg-white/95 px-4 py-2">
          <span className="font-display text-sm font-bold text-plum-700">Hangout Hub</span>
          <div className="flex items-center gap-2">
            <span className="hidden text-[10px] font-medium text-cozy-600 sm:inline">My Rooms</span>
            <span className="rounded-lg p-1 text-xs">🔔</span>
            <div className="relative">
              <AvatarPreview avatar={DEMO_MEMBERS[0].avatar} size="sm" scale={0.75} />
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 ring-2 ring-white" />
            </div>
          </div>
        </div>

        <div className="bg-cozy-50 p-3 sm:p-4">
          {/* Room header — matches VirtualRoomPage */}
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-[10px] text-plum-600">← All rooms</p>
              <h3 className="font-display text-sm font-bold text-cozy-900 sm:text-base">Cozy Café</h3>
              <p className="text-[10px] text-cozy-500 sm:text-xs">
                Living / Meeting Room — Casual voice chat &amp; hangouts
              </p>
            </div>
            <div className="flex flex-wrap gap-1">
              {SUB_ROOMS.map((s) => (
                <span
                  key={s.id}
                  className={`rounded-lg px-2 py-0.5 text-[10px] font-medium ${
                    s.id === "living"
                      ? "bg-plum-600 text-white"
                      : "bg-cozy-200 text-cozy-800"
                  }`}
                >
                  {s.label.split(" ")[0]}
                </span>
              ))}
              <span className="rounded-lg bg-cozy-200 px-2 py-0.5 text-[10px] font-medium text-cozy-800">
                Settings
              </span>
            </div>
          </div>

          {/* Main grid — matches VirtualRoomPage 2/3 + 1/3 */}
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="space-y-2 lg:col-span-2">
              <PreviewWorldMap />

              {/* Chat panel */}
              <div className="flex h-20 flex-col rounded-xl border border-cozy-200 bg-white/95">
                <p className="border-b border-cozy-100 px-2 py-1 text-[10px] font-semibold text-cozy-600">
                  Message chat
                </p>
                <div className="flex-1 overflow-hidden px-2 py-1 text-[10px] leading-relaxed">
                  <p>
                    <span className="font-medium text-plum-700">J:</span> anyone free tonight?
                  </p>
                  <p>
                    <span className="font-medium text-plum-700">Sammy:</span> im in the living room 🛋️
                  </p>
                  <p>
                    <span className="font-medium text-plum-700">Al:</span> same, voice is on
                  </p>
                </div>
              </div>
            </div>

            {/* Side panel */}
            <div className="card min-h-[120px] p-3 lg:col-span-1">
              <h4 className="text-xs font-semibold text-cozy-900">Living / meeting room</h4>
              <p className="mt-1 text-[10px] leading-relaxed text-cozy-600">
                Casual voice chat and hangouts. Walk your avatar into any zone on the map — living
                room, calendar, decision room, ideas, or personal spaces.
              </p>
              <div className="mt-3 space-y-1.5">
                <p className="text-[10px] font-medium text-cozy-700">In this room</p>
                {DEMO_MEMBERS.map((m) => (
                  <div key={m.name} className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${PRESENCE_DOT[m.presence]}`} />
                    <span className="text-[10px] text-cozy-600">{m.nickname}</span>
                    <span className="text-[10px] text-cozy-400">· {m.presence}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-white/70">
        Bird&apos;s-eye virtual rooms, room nicknames, voice chat, and shared tools — just like the
        real app.
      </p>
    </div>
  );
}
