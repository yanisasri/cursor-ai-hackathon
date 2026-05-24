import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getVelocityFromHeldKeys, useHeldKeys } from "../hooks/useHeldKeys";
import { useRoomAvatarPresence } from "../hooks/useRoomAvatarPresence";
import type { VoiceChatState } from "../hooks/useVoiceChat";
import { useApp } from "../context/AppContext";
import { AvatarPreview } from "./AvatarPreview";
import { VoiceChatPanel } from "./VoiceChatPanel";
import { DEFAULT_AVATAR, getDisplayAvatar, isPersonalRoomOccupied, isApprovedPersonalGuest, type PersonalRoomAccess, type SubRoomType } from "../types";

interface VoiceContextProps {
  title: string;
  participantNames: Record<string, string>;
  voice: VoiceChatState;
}

interface Props {
  roomId: string;
  memberIds: string[];
  area: string;
  activeSubRoom: SubRoomType;
  activePersonalOwner?: string | null;
  onEnterSubRoom: (zone: SubRoomType, ownerId?: string) => void;
  onPersonalRoomVisit?: (ownerId: string) => void;
  onPersonalRoomZoneEnter?: (ownerId: string) => void;
  onPersonalRoomZoneLeave?: (ownerId: string) => void;
  onClearPersonalRoomVisit?: () => void;
  onOpenOwnMailbox?: () => void;
  onPersonalRoomHover?: (ownerId: string) => void;
  onPersonalRoomHoverEnd?: () => void;
  voiceContext?: VoiceContextProps | null;
}

const DEFAULT_SPAWN = { x: 500, y: 240 };
export const WORLD_W = 640;
export const BASE_WORLD_H = 480;
const SPEED = 3.5;

export const PERSONAL_COLS = 4;
export const PERSONAL_ZONE_W = 130;
export const PERSONAL_ZONE_H = 74;
export const PERSONAL_GAP = 10;
export const PERSONAL_START_Y = 306;

export const CORRIDOR_AVATAR_SLOTS = [
  { x: 170, y: 268 },
  { x: 250, y: 268 },
  { x: 330, y: 268 },
  { x: 410, y: 268 },
  { x: 490, y: 268 },
  { x: 210, y: 228 },
  { x: 370, y: 228 },
];

function getWorldHeight(memberCount: number): number {
  const rows = Math.ceil(Math.max(memberCount, 1) / PERSONAL_COLS);
  if (rows <= 1) return BASE_WORLD_H;
  const blockBottom =
    PERSONAL_START_Y + rows * (PERSONAL_ZONE_H + PERSONAL_GAP) - PERSONAL_GAP + 32;
  return Math.max(BASE_WORLD_H, blockBottom);
}

function getPersonalRoomStatusLabel(
  ownerId: string,
  userId: string | undefined,
  access: PersonalRoomAccess | undefined,
  canEnter: boolean
): string {
  if (!userId) return "Personal Room";
  if (userId === ownerId) return "Your room";
  if (canEnter) return "Tap to enter";
  if (access && isApprovedPersonalGuest(access, userId)) return "Approved — wait your turn";
  if (access?.pendingRequests.some((r) => r.userId === userId)) return "Pending…";
  if (access && isPersonalRoomOccupied(access)) return "Guest inside";
  return "Request access";
}

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
  { type: "decision", x: 440, y: 40, w: 160, h: 120, color: "#fde8e8", label: "Decision Room" },
  { type: "suggestions", x: 40, y: 190, w: 200, h: 105, color: "#fff3cd", label: "Ideas" },
];

const areaBg: Record<string, string> = {
  house: "#b87040",
  office: "#e8eef5",
  cafe: "#f5e6d3",
  park: "#e8f5e9",
};

function zoneCenter(z: { x: number; y: number; w: number; h: number }) {
  return { x: z.x + z.w / 2, y: z.y + z.h / 2 };
}

// ─── SVG patterns & filters (house area only) ─────────────────────────────────
export function HouseDefs() {
  return (
    <defs>
      {/* Main corridor – warm mid-brown planks */}
      <pattern id="woodMain" x="0" y="0" width="40" height="9" patternUnits="userSpaceOnUse">
        <rect width="40" height="9" fill="#c07840" />
        <line x1="0" y1="0" x2="40" y2="0" stroke="#a86430" strokeWidth="0.9" opacity="0.45" />
        <line x1="0" y1="4.5" x2="40" y2="4.5" stroke="#a86430" strokeWidth="0.4" opacity="0.25" />
        <line x1="20" y1="0" x2="20" y2="4.5" stroke="#a86430" strokeWidth="0.4" opacity="0.15" />
      </pattern>
      {/* Room floors – lighter planks */}
      <pattern id="woodLight" x="0" y="0" width="40" height="9" patternUnits="userSpaceOnUse">
        <rect width="40" height="9" fill="#d49858" />
        <line x1="0" y1="0" x2="40" y2="0" stroke="#bc8448" strokeWidth="0.7" opacity="0.35" />
        <line x1="0" y1="4.5" x2="40" y2="4.5" stroke="#bc8448" strokeWidth="0.3" opacity="0.18" />
      </pattern>
      {/* Calendar room – stone tile */}
      <pattern id="tileFloor" x="0" y="0" width="18" height="18" patternUnits="userSpaceOnUse">
        <rect width="18" height="18" fill="#e2dcd4" />
        <rect width="18" height="18" fill="none" stroke="#cec8c0" strokeWidth="0.8" />
      </pattern>
      {/* Personal rooms – soft blue planks */}
      <pattern id="persFloor" x="0" y="0" width="30" height="8" patternUnits="userSpaceOnUse">
        <rect width="30" height="8" fill="#c4d4ec" />
        <line x1="0" y1="0" x2="30" y2="0" stroke="#a8bcd8" strokeWidth="0.6" opacity="0.3" />
      </pattern>
      {/* Subtle drop shadow */}
      <filter id="ds" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="1" dy="2" stdDeviation="1.5" floodColor="#3d2b1a" floodOpacity="0.18" />
      </filter>
    </defs>
  );
}

// ─── Static house rooms + corridor ────────────────────────────────────────────
export function HouseStaticRooms({ worldH }: { worldH: number }) {
  const innerH = worldH - 20;
  return (
    <>
      {/* Main corridor/hallway wood floor */}
      <rect x="0" y="0" width="640" height={worldH} fill="url(#woodMain)" />
      {/* Outer house wall */}
      <rect x="10" y="10" width="620" height={innerH} rx="14" fill="none" stroke="#7d5030" strokeWidth="7" />
      <rect x="16" y="16" width="608" height={innerH - 12} rx="12" fill="none" stroke="#9a6840" strokeWidth="1.5" opacity="0.3" />

      {worldH > BASE_WORLD_H && (
        <>
          <rect x="24" y="472" width="592" height={worldH - 484} rx="8" fill="#c4956a" opacity="0.12" />
          <rect x="274" y="478" width="92" height="14" rx="5" fill="#ffffff48" />
          <text x="320" y="488" fontSize="8" fill="#7d5a42" fontWeight="500" textAnchor="middle">
            Personal rooms
          </text>
          <rect x="48" y="490" width="12" height="14" rx="3" fill="#8b6340" />
          <circle cx="54" cy="485" r="10" fill="#74c69d" filter="url(#ds)" />
          <rect x="580" y="490" width="12" height="14" rx="3" fill="#8b6340" />
          <circle cx="586" cy="485" r="10" fill="#74c69d" filter="url(#ds)" />
        </>
      )}

      {/* ══ LIVING ROOM  (40, 40, 160 × 120) ════════════════════════════════ */}
      <rect x="40" y="40" width="160" height="120" fill="url(#woodLight)" rx="4" />
      <rect x="40" y="40" width="160" height="120" fill="none" stroke="#ede6d8" strokeWidth="7" rx="4" />
      {/* door gap – bottom wall, centre */}
      <rect x="106" y="156" width="36" height="7" fill="url(#woodMain)" />

      {/* Purple area rug */}
      <ellipse cx="120" cy="114" rx="45" ry="27" fill="#c8aad8" opacity="0.55" />
      <ellipse cx="120" cy="114" rx="38" ry="20" fill="none" stroke="#b090c8" strokeWidth="1.5" opacity="0.45" />

      {/* Sofa body */}
      <rect x="51" y="47" width="98" height="35" rx="7" fill="#8a7a9c" filter="url(#ds)" />
      <rect x="51" y="47" width="98" height="11" rx="5" fill="#7a6a8c" />
      {/* Cushions */}
      <rect x="55" y="51" width="28" height="27" rx="4" fill="#a090b8" />
      <rect x="87" y="51" width="28" height="27" rx="4" fill="#a090b8" />
      <rect x="117" y="51" width="28" height="27" rx="4" fill="#a090b8" />
      {/* Arm rests */}
      <rect x="51" y="48" width="7" height="31" rx="3" fill="#7a6a8c" />
      <rect x="141" y="48" width="7" height="31" rx="3" fill="#7a6a8c" />

      {/* Coffee table */}
      <rect x="86" y="92" width="68" height="38" rx="5" fill="#8b6340" filter="url(#ds)" />
      <rect x="90" y="96" width="60" height="30" rx="3" fill="#9e7252" />
      {/* Cup + magazine on table */}
      <circle cx="113" cy="111" r="5" fill="#f5deb3" opacity="0.9" />
      <circle cx="113" cy="111" r="3" fill="#d2a570" opacity="0.9" />
      <rect x="126" y="107" width="15" height="10" rx="2" fill="#e0d4c0" opacity="0.75" />

      {/* Bookshelf – right wall */}
      <rect x="178" y="48" width="15" height="70" rx="2" fill="#6b4c30" filter="url(#ds)" />
      <rect x="180" y="52" width="11" height="7" rx="1" fill="#9e8ab4" />
      <rect x="180" y="61" width="11" height="7" rx="1" fill="#6da86d" />
      <rect x="180" y="70" width="11" height="7" rx="1" fill="#e89858" />
      <rect x="180" y="79" width="11" height="7" rx="1" fill="#a87aac" />
      <rect x="180" y="88" width="11" height="7" rx="1" fill="#6da898" />
      <rect x="180" y="97" width="11" height="7" rx="1" fill="#e8c058" />

      {/* Plant – bottom-left corner */}
      <rect x="46" y="138" width="14" height="16" rx="3" fill="#8b6340" />
      <circle cx="53" cy="133" r="12" fill="#74c69d" filter="url(#ds)" />
      <circle cx="47" cy="129" r="8" fill="#52b788" />
      <circle cx="59" cy="130" r="7" fill="#40916c" />

      {/* Room label strip */}
      <rect x="40" y="40" width="160" height="15" rx="3" fill="#c8aad860" />
      <text x="48" y="52" fontSize="9" fontWeight="bold" fill="#5a3d70" letterSpacing="0.5">
        LIVING ROOM
      </text>

      {/* ══ CALENDAR ROOM  (240, 40, 160 × 120) ══════════════════════════════ */}
      <rect x="240" y="40" width="160" height="120" fill="url(#tileFloor)" rx="4" />
      <rect x="240" y="40" width="160" height="120" fill="none" stroke="#ede6d8" strokeWidth="7" rx="4" />
      {/* door gap */}
      <rect x="306" y="156" width="36" height="7" fill="url(#woodMain)" />
      {/* Green tint overlay */}
      <rect x="244" y="44" width="152" height="112" rx="2" fill="#d8f3dc" opacity="0.1" />

      {/* Conference table */}
      <rect x="266" y="67" width="108" height="56" rx="6" fill="#6b5030" filter="url(#ds)" />
      <rect x="270" y="71" width="100" height="48" rx="4" fill="#8b6840" />
      <rect x="273" y="74" width="94" height="42" rx="3" fill="#9a7848" opacity="0.4" />

      {/* Chairs – top row */}
      <rect x="278" y="57" width="22" height="9" rx="3" fill="#6a986a" filter="url(#ds)" />
      <rect x="309" y="57" width="22" height="9" rx="3" fill="#6a986a" filter="url(#ds)" />
      <rect x="340" y="57" width="22" height="9" rx="3" fill="#6a986a" filter="url(#ds)" />
      {/* Chairs – bottom row */}
      <rect x="278" y="124" width="22" height="9" rx="3" fill="#6a986a" filter="url(#ds)" />
      <rect x="309" y="124" width="22" height="9" rx="3" fill="#6a986a" filter="url(#ds)" />
      <rect x="340" y="124" width="22" height="9" rx="3" fill="#6a986a" filter="url(#ds)" />
      {/* Chairs – left */}
      <rect x="256" y="80" width="9" height="18" rx="3" fill="#6a986a" filter="url(#ds)" />
      <rect x="256" y="103" width="9" height="18" rx="3" fill="#6a986a" filter="url(#ds)" />
      {/* Chairs – right */}
      <rect x="375" y="80" width="9" height="18" rx="3" fill="#6a986a" filter="url(#ds)" />
      <rect x="375" y="103" width="9" height="18" rx="3" fill="#6a986a" filter="url(#ds)" />

      {/* Whiteboard – top wall */}
      <rect x="260" y="41" width="60" height="20" rx="2" fill="#fefefe" stroke="#d0ccc8" strokeWidth="1" filter="url(#ds)" />
      <line x1="264" y1="48" x2="316" y2="48" stroke="#80b880" strokeWidth="1.5" opacity="0.7" />
      <line x1="264" y1="53" x2="306" y2="53" stroke="#80b880" strokeWidth="1.5" opacity="0.5" />
      <line x1="264" y1="57" x2="312" y2="57" stroke="#80b880" strokeWidth="1.2" opacity="0.3" />

      {/* Calendar icon – top wall */}
      <rect x="332" y="41" width="26" height="22" rx="2" fill="#eef8ee" stroke="#98c898" strokeWidth="1" filter="url(#ds)" />
      <rect x="334" y="43" width="22" height="5" rx="1" fill="#70a870" />
      <rect x="334" y="50" width="5" height="4" rx="1" fill="#90b890" />
      <rect x="341" y="50" width="5" height="4" rx="1" fill="#90b890" />
      <rect x="348" y="50" width="5" height="4" rx="1" fill="#e07070" />
      <rect x="334" y="56" width="5" height="4" rx="1" fill="#90b890" />
      <rect x="341" y="56" width="5" height="4" rx="1" fill="#e07070" />
      <rect x="348" y="56" width="5" height="4" rx="1" fill="#90b890" />

      {/* Room label */}
      <rect x="240" y="40" width="160" height="15" rx="3" fill="#a8d8a860" />
      <text x="248" y="52" fontSize="9" fontWeight="bold" fill="#3a6040" letterSpacing="0.5">
        CALENDAR
      </text>

      {/* ══ DECISIONS ROOM  (440, 40, 160 × 120) ═════════════════════════════ */}
      <rect x="440" y="40" width="160" height="120" fill="url(#woodLight)" rx="4" />
      <rect x="440" y="40" width="160" height="120" fill="none" stroke="#ede6d8" strokeWidth="7" rx="4" />
      {/* door gap */}
      <rect x="506" y="156" width="36" height="7" fill="url(#woodMain)" />

      {/* Pink circle rug */}
      <circle cx="520" cy="102" r="42" fill="#f8c4c4" opacity="0.5" />
      <circle cx="520" cy="102" r="35" fill="none" stroke="#f0a0a0" strokeWidth="1.5" opacity="0.45" />

      {/* Round table */}
      <circle cx="520" cy="102" r="27" fill="#7a5628" filter="url(#ds)" />
      <circle cx="520" cy="102" r="23" fill="#9e7252" />
      {/* Items on table */}
      <circle cx="512" cy="96" r="4" fill="#f5e8d0" opacity="0.85" />
      <circle cx="528" cy="108" r="4" fill="#f5e8d0" opacity="0.85" />
      <rect x="513" y="100" width="13" height="8" rx="1" fill="#e8d8c0" opacity="0.6" />

      {/* 4 chairs around round table */}
      <rect x="506" y="59" width="28" height="10" rx="4" fill="#e09090" filter="url(#ds)" />
      <rect x="506" y="131" width="28" height="10" rx="4" fill="#e09090" filter="url(#ds)" />
      <rect x="449" y="91" width="10" height="22" rx="4" fill="#e09090" filter="url(#ds)" />
      <rect x="581" y="91" width="10" height="22" rx="4" fill="#e09090" filter="url(#ds)" />

      {/* Vote/poll board – right wall */}
      <rect x="582" y="50" width="14" height="60" rx="2" fill="#fef0f0" stroke="#e8c0c0" strokeWidth="1" filter="url(#ds)" />
      <text x="589" y="63" fontSize="6" fill="#c07070" textAnchor="middle" fontWeight="bold">
        VOTE
      </text>
      <rect x="585" y="66" width="9" height="3.5" rx="1" fill="#e08888" opacity="0.9" />
      <rect x="585" y="71" width="7" height="3.5" rx="1" fill="#e0a8a8" opacity="0.9" />
      <rect x="585" y="76" width="10" height="3.5" rx="1" fill="#e08888" opacity="0.8" />
      <rect x="585" y="81" width="5" height="3.5" rx="1" fill="#e0c0c0" opacity="0.8" />
      <rect x="585" y="86" width="8" height="3.5" rx="1" fill="#e08888" opacity="0.7" />
      <rect x="585" y="91" width="6" height="3.5" rx="1" fill="#e0a8a8" opacity="0.7" />

      {/* Plant – bottom-left corner */}
      <rect x="447" y="138" width="14" height="16" rx="3" fill="#8b6340" />
      <circle cx="454" cy="133" r="12" fill="#74c69d" filter="url(#ds)" />
      <circle cx="447" cy="129" r="8" fill="#52b788" />
      <circle cx="460" cy="130" r="7" fill="#40916c" />

      {/* Room label */}
      <rect x="440" y="40" width="160" height="15" rx="3" fill="#f8c4c460" />
      <text x="448" y="52" fontSize="9" fontWeight="bold" fill="#6a3040" letterSpacing="0.5">
        DECISION ROOM
      </text>

      {/* ══ IDEAS / SUGGESTIONS ROOM  (40, 190, 200 × 105) ═══════════════════ */}
      <rect x="40" y="190" width="200" height="105" fill="url(#woodLight)" rx="4" />
      <rect x="40" y="190" width="200" height="105" fill="none" stroke="#ede6d8" strokeWidth="7" rx="4" />
      {/* door gap – top wall, toward right */}
      <rect x="188" y="186" width="36" height="7" fill="url(#woodMain)" />
      {/* Warm yellow overlay */}
      <rect x="44" y="194" width="192" height="97" rx="2" fill="#fff3cd" opacity="0.1" />

      {/* Whiteboard – left wall */}
      <rect x="41" y="198" width="22" height="76" rx="2" fill="#fefef8" stroke="#d8d4c0" strokeWidth="1" filter="url(#ds)" />
      {/* Sticky notes on whiteboard */}
      <rect x="43" y="201" width="8" height="8" rx="1" fill="#fff176" />
      <rect x="53" y="201" width="8" height="8" rx="1" fill="#f48fb1" />
      <rect x="43" y="211" width="8" height="8" rx="1" fill="#80deea" />
      <rect x="53" y="211" width="8" height="8" rx="1" fill="#a5d6a7" />
      <rect x="43" y="221" width="8" height="8" rx="1" fill="#ffcc80" />
      <rect x="53" y="221" width="8" height="8" rx="1" fill="#ce93d8" />
      {/* Whiteboard lines */}
      <line x1="44" y1="234" x2="60" y2="234" stroke="#b8b8b8" strokeWidth="0.8" opacity="0.5" />
      <line x1="44" y1="240" x2="58" y2="240" stroke="#b8b8b8" strokeWidth="0.7" opacity="0.4" />
      <line x1="44" y1="246" x2="60" y2="246" stroke="#b8b8b8" strokeWidth="0.6" opacity="0.35" />
      <line x1="44" y1="252" x2="56" y2="252" stroke="#b8b8b8" strokeWidth="0.6" opacity="0.3" />
      <line x1="44" y1="258" x2="60" y2="258" stroke="#b8b8b8" strokeWidth="0.5" opacity="0.25" />

      {/* Beanbags */}
      <circle cx="132" cy="245" r="18" fill="#f9d67a" filter="url(#ds)" />
      <ellipse cx="132" cy="249" rx="14" ry="10" fill="#f0c850" opacity="0.55" />
      <circle cx="184" cy="258" r="16" fill="#f48fb1" filter="url(#ds)" />
      <ellipse cx="184" cy="262" rx="12" ry="9" fill="#f06090" opacity="0.5" />
      <circle cx="100" cy="264" r="15" fill="#80deea" filter="url(#ds)" />
      <ellipse cx="100" cy="268" rx="11" ry="8" fill="#40c8d8" opacity="0.5" />

      {/* Scattered sticky notes on floor */}
      <rect x="162" y="220" width="20" height="20" rx="2" fill="#fff176" opacity="0.85" filter="url(#ds)" transform="rotate(-8,162,220)" />
      <rect x="189" y="224" width="18" height="18" rx="2" fill="#f48fb1" opacity="0.8" filter="url(#ds)" transform="rotate(6,189,224)" />
      <rect x="212" y="216" width="18" height="18" rx="2" fill="#a5d6a7" opacity="0.8" filter="url(#ds)" transform="rotate(-4,212,216)" />
      <rect x="160" y="245" width="16" height="16" rx="2" fill="#80deea" opacity="0.75" filter="url(#ds)" transform="rotate(10,160,245)" />

      {/* Plant – right corner */}
      <rect x="222" y="272" width="14" height="16" rx="3" fill="#8b6340" />
      <circle cx="229" cy="267" r="12" fill="#74c69d" filter="url(#ds)" />
      <circle cx="222" cy="263" r="8" fill="#52b788" />
      <circle cx="235" cy="264" r="7" fill="#40916c" />

      {/* Room label */}
      <rect x="40" y="190" width="200" height="15" rx="3" fill="#fff3cd60" />
      <text x="48" y="202" fontSize="9" fontWeight="bold" fill="#6a5020" letterSpacing="0.5">
        IDEAS &amp; SUGGESTIONS
      </text>

      {/* ══ CORRIDOR DECORATIONS ══════════════════════════════════════════════ */}
      {/* Centre corridor rug */}
      <rect x="344" y="166" width="100" height="118" rx="8" fill="#c4956a" opacity="0.2" />
      <rect x="348" y="170" width="92" height="110" rx="6" fill="none" stroke="#a87848" strokeWidth="1.5" opacity="0.28" />

      {/* Hallway label */}
      <rect x="300" y="165" width="62" height="14" rx="5" fill="#ffffff48" />
      <text x="331" y="175" fontSize="8" fill="#7d5a42" fontWeight="500" textAnchor="middle">
        Hallway
      </text>

      {/* Corridor lamp */}
      <rect x="268" y="175" width="6" height="9" rx="1" fill="#8b6340" opacity="0.75" />
      <circle cx="271" cy="172" r="8" fill="#f8e8c0" filter="url(#ds)" opacity="0.8" />
      <circle cx="271" cy="172" r="5" fill="#fdf4d8" opacity="0.95" />

      {/* Potted plant – corridor left */}
      <rect x="30" y="162" width="12" height="14" rx="3" fill="#8b6340" />
      <circle cx="36" cy="157" r="10" fill="#74c69d" filter="url(#ds)" />
      <circle cx="30" cy="153" r="7" fill="#52b788" />
      <circle cx="42" cy="154" r="6" fill="#40916c" />

      {/* Potted plant – corridor right */}
      <rect x="598" y="162" width="12" height="14" rx="3" fill="#8b6340" />
      <circle cx="604" cy="157" r="10" fill="#74c69d" filter="url(#ds)" />
      <circle cx="598" cy="153" r="7" fill="#52b788" />
      <circle cx="610" cy="154" r="6" fill="#40916c" />

      {/* Plant between calendar & decisions */}
      <rect x="416" y="163" width="11" height="13" rx="2" fill="#8b6340" />
      <circle cx="421" cy="158" r="9" fill="#95d5b2" filter="url(#ds)" />

      {/* Plant east of ideas room */}
      <rect x="248" y="188" width="11" height="13" rx="2" fill="#8b6340" />
      <circle cx="254" cy="183" r="9" fill="#95d5b2" filter="url(#ds)" />
    </>
  );
}

// ─── Personal room SVG (drawn once per member) ────────────────────────────────
export function PersonalRoomSVG({
  x,
  y,
  w,
  h,
  isOwner,
  displayName,
  username,
  statusLabel,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  isOwner: boolean;
  displayName: string;
  username: string;
  statusLabel?: string;
}) {
  const headColor = isOwner ? "#7090b8" : "#7878a8";
  const frameColor = isOwner ? "#9ab4d8" : "#9898c0";
  const mattressColor = isOwner ? "#dce8f8" : "#dcdcf0";
  const blanketColor = isOwner ? "#b8ccec" : "#b8b8d8";
  const cx = x + w / 2;
  const labelH = 22;
  const bedTop = y + labelH + 2;
  const bedH = h - labelH - 6;

  return (
    <g>
      {/* Room floor */}
      <rect x={x} y={y} width={w} height={h} rx="4" fill="url(#persFloor)" />
      {/* Walls */}
      <rect x={x} y={y} width={w} height={h} rx="4" fill="none" stroke="#ede6d8" strokeWidth="5" />
      {/* Door gap – top wall, centre */}
      <rect x={cx - 13} y={y - 3} width="26" height="6" fill="url(#woodMain)" />

      {/* Name plate – display name with username below */}
      <rect x={x} y={y} width={w} height={labelH} rx="3" fill={isOwner ? "#dbeafe90" : "#e0e7ff90"} />
      <text
        x={cx}
        y={y + 10}
        fontSize="8"
        fontWeight="bold"
        fill="#3a4070"
        textAnchor="middle"
      >
        {displayName.length > 14 ? `${displayName.slice(0, 13)}…` : displayName}
      </text>
      <text x={cx} y={y + 19} fontSize="6.5" fill="#5868a0" textAnchor="middle">
        {username.length > 16 ? `${username.slice(0, 15)}…` : username}
      </text>

      {/* Bed frame */}
      <rect
        x={x + 8}
        y={bedTop}
        width={w - 16}
        height={bedH}
        rx="4"
        fill={frameColor}
        filter="url(#ds)"
      />
      {/* Mattress */}
      <rect x={x + 10} y={bedTop + 2} width={w - 20} height={bedH - 4} rx="3" fill={mattressColor} />
      {/* Headboard */}
      <rect x={x + 8} y={bedTop} width={w - 16} height={10} rx="3" fill={headColor} />
      {/* Pillows */}
      <ellipse cx={cx - 13} cy={bedTop + 12} rx="9" ry="5" fill="#f8f0ff" opacity="0.9" />
      <ellipse cx={cx + 9} cy={bedTop + 12} rx="9" ry="5" fill="#f8f0ff" opacity="0.9" />
      {/* Blanket */}
      <rect
        x={x + 10}
        y={bedTop + 2 + (bedH - 4) * 0.45}
        width={w - 20}
        height={(bedH - 4) * 0.55}
        rx="3"
        fill={blanketColor}
        opacity="0.65"
      />

      {/* Door topic tag */}
      <rect x={cx - 32} y={y + h - 12} width="64" height="11" rx="3" fill="#ffffffcc" />
      <text x={cx} y={y + h - 4} fontSize="5" fill="#5868a0" textAnchor="middle" fontWeight="600">
        Personal Room
      </text>
      {statusLabel && (
        <>
          <rect x={cx - 36} y={y + h + 1} width="72" height="10" rx="3" fill={isOwner ? "#dbeafecc" : "#fef3c7cc"} />
          <text x={cx} y={y + h + 8.5} fontSize="4.8" fill="#5a5070" textAnchor="middle">
            {statusLabel.length > 18 ? `${statusLabel.slice(0, 17)}…` : statusLabel}
          </text>
        </>
      )}
    </g>
  );
}

// ─── Original non-house area furniture ────────────────────────────────────────
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

// ─── Main component ────────────────────────────────────────────────────────────
export function VirtualWorld({
  roomId,
  memberIds,
  area,
  activeSubRoom,
  activePersonalOwner,
  onEnterSubRoom,
  onPersonalRoomZoneEnter,
  onPersonalRoomZoneLeave,
  onClearPersonalRoomVisit,
  onOpenOwnMailbox,
  onPersonalRoomHover,
  onPersonalRoomHoverEnd,
  voiceContext,
}: Props) {
  const {
    user,
    users,
    personalRoomAccess,
    getRoomDisplayName,
    canEnterPersonalRoom,
  } = useApp();
  const [pos, setPos] = useState(DEFAULT_SPAWN);
  const posRef = useRef(DEFAULT_SPAWN);
  const [target, setTarget] = useState<{ x: number; y: number } | null>(null);
  const heldKeysRef = useHeldKeys(true);
  const lastZoneRef = useRef<string | null>(null);
  const leaveZoneTimerRef = useRef<number | null>(null);

  const others = useRoomAvatarPresence({
    roomId,
    userId: user?.id,
    posRef,
    activeSubRoom,
    activePersonalOwner,
    inVoice: Boolean(voiceContext?.voice.isActive),
    getDisplayName: (id) =>
      getRoomDisplayName(roomId, id) || users.find((u) => u.id === id)?.displayName || "Friend",
    enabled: Boolean(user && roomId),
  });

  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  const worldH = useMemo(() => getWorldHeight(memberIds.length), [memberIds.length]);

  const personalZones = useMemo(() => {
    const count = memberIds.length;
    const cols = Math.min(PERSONAL_COLS, Math.max(1, count));
    const totalW = cols * PERSONAL_ZONE_W + (cols - 1) * PERSONAL_GAP;
    const startX = Math.max(16, (WORLD_W - totalW) / 2);

    return memberIds.map((ownerId, index) => {
      const col = index % PERSONAL_COLS;
      const row = Math.floor(index / PERSONAL_COLS);
      return {
        ownerId,
        type: "personal" as const,
        x: startX + col * (PERSONAL_ZONE_W + PERSONAL_GAP),
        y: PERSONAL_START_Y + row * (PERSONAL_ZONE_H + PERSONAL_GAP),
        w: PERSONAL_ZONE_W,
        h: PERSONAL_ZONE_H,
        color: ownerId === user?.id ? "#dbeafe" : "#e0e7ff",
        label: `${getRoomDisplayName(roomId, ownerId)}'s Room`,
      };
    });
  }, [memberIds, user, roomId, getRoomDisplayName]);

  const clamp = useCallback(
    (x: number, y: number) => ({
      x: Math.max(24, Math.min(WORLD_W - 24, x)),
      y: Math.max(24, Math.min(worldH - 24, y)),
    }),
    [worldH]
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
            const next = clamp(target.x, target.y);
            posRef.current = next;
            return next;
          }
          x += (dx / dist) * SPEED;
          y += (dy / dist) * SPEED;
          const next = clamp(x, y);
          posRef.current = next;
          return next;
        }

        const { dx, dy } = getVelocityFromHeldKeys(heldKeysRef.current, SPEED);
        if (dx !== 0 || dy !== 0) {
          const next = clamp(x + dx, y + dy);
          posRef.current = next;
          return next;
        }
        return p;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, clamp, heldKeysRef]);

  useEffect(() => {
    const leavePreviousPersonalZone = (
      previousKey: string | null,
      nextZone?: (typeof zones)[number]
    ) => {
      if (!previousKey?.startsWith("personal:")) return;
      const previousOwnerId = previousKey.slice("personal:".length);
      if (!previousOwnerId) return;
      const stayingInSamePersonal =
        nextZone?.type === "personal" &&
        "ownerId" in nextZone &&
        String(nextZone.ownerId ?? "") === previousOwnerId;
      if (!stayingInSamePersonal) {
        onPersonalRoomZoneLeave?.(previousOwnerId);
      }
    };

    const zones = [...BASE_ZONES, ...personalZones];
    for (const z of zones) {
      if (
        pos.x >= z.x &&
        pos.x <= z.x + z.w &&
        pos.y >= z.y &&
        pos.y <= z.y + z.h
      ) {
        if (leaveZoneTimerRef.current != null) {
          window.clearTimeout(leaveZoneTimerRef.current);
          leaveZoneTimerRef.current = null;
        }

        const zoneKey =
          z.type === "personal" && "ownerId" in z ? `personal:${z.ownerId}` : z.type;
        if (lastZoneRef.current !== zoneKey) {
          leavePreviousPersonalZone(lastZoneRef.current, z);
          lastZoneRef.current = zoneKey;
          if (z.type === "personal" && "ownerId" in z) {
            const ownerId = String(z.ownerId ?? "");
            if (!ownerId) return;
            onEnterSubRoom("personal", ownerId);
            if (user && ownerId === user.id) {
              onOpenOwnMailbox?.();
            } else if (user) {
              onPersonalRoomZoneEnter?.(ownerId);
            }
          } else {
            onEnterSubRoom(z.type);
            onClearPersonalRoomVisit?.();
          }
        }
        return;
      }
    }

    if (leaveZoneTimerRef.current != null) return;

    leaveZoneTimerRef.current = window.setTimeout(() => {
      leaveZoneTimerRef.current = null;
      leavePreviousPersonalZone(lastZoneRef.current);
      lastZoneRef.current = null;
      onClearPersonalRoomVisit?.();
    }, 450);
  }, [
    pos,
    onEnterSubRoom,
    onClearPersonalRoomVisit,
    onOpenOwnMailbox,
    onPersonalRoomZoneEnter,
    onPersonalRoomZoneLeave,
    personalZones,
    user,
  ]);

  useEffect(
    () => () => {
      if (leaveZoneTimerRef.current != null) {
        window.clearTimeout(leaveZoneTimerRef.current);
      }
    },
    []
  );

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

  const isHouse = area === "house";

  return (
    <div className="space-y-3">
      <div
        className="relative mx-auto overflow-hidden rounded-2xl border-4 border-cozy-300 shadow-inner"
        style={{
          width: WORLD_W,
          maxWidth: "100%",
          height: worldH,
          background: areaBg[area] ?? "#f3ebe0",
        }}
      >
        {/* ── SVG visual layer ─────────────────────────────────────────────── */}
        <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${WORLD_W} ${worldH}`}>
          {isHouse ? (
            <>
              <HouseDefs />
              <HouseStaticRooms worldH={worldH} />
              {/* Personal room floors & beds (dynamic – needs runtime data) */}
              {personalZones.map((z) => {
                const member = users.find((u) => u.id === z.ownerId);
                const access = personalRoomAccess.find(
                  (a) => a.roomId === roomId && a.ownerId === z.ownerId
                );
                const canEnter =
                  !!user && canEnterPersonalRoom(roomId, z.ownerId, user.id);
                return (
                  <PersonalRoomSVG
                    key={z.ownerId}
                    x={z.x}
                    y={z.y}
                    w={z.w}
                    h={z.h}
                    isOwner={z.ownerId === user?.id}
                    displayName={getRoomDisplayName(roomId, z.ownerId)}
                    username={member?.displayName ?? "Friend"}
                    statusLabel={getPersonalRoomStatusLabel(
                      z.ownerId,
                      user?.id,
                      access,
                      canEnter
                    )}
                  />
                );
              })}
            </>
          ) : (
            <>
              <rect
                x="0"
                y="0"
                width={WORLD_W}
                height={worldH}
                fill="rgba(255,255,255,0.12)"
              />
              <rect
                x="12"
                y="12"
                width="616"
                height={worldH - 24}
                rx="18"
                fill="none"
                stroke="#7d5a42"
                strokeWidth="6"
              />
              <line x1="210" y1="12" x2="210" y2="130" stroke="#7d5a42" strokeWidth="6" />
              <line x1="430" y1="12" x2="430" y2="130" stroke="#7d5a42" strokeWidth="6" />
              <line x1="12" y1="310" x2="628" y2="310" stroke="#7d5a42" strokeWidth="6" />
              <line x1="12" y1="150" x2="140" y2="150" stroke="#7d5a42" strokeWidth="6" />
              <line x1="500" y1="150" x2="628" y2="150" stroke="#7d5a42" strokeWidth="6" />
              <line x1="320" y1="310" x2="320" y2={worldH - 12} stroke="#7d5a42" strokeWidth="6" />
              <AreaFurniture area={area} />
              <rect x="228" y="274" width="190" height="22" rx="8" fill="#ffffff66" />
              <text x="245" y="289" fontSize="12" fill="#5f4b3a">
                Hallway
              </text>
            </>
          )}
        </svg>

        {/* ── Grid overlay (non-house only) ────────────────────────────────── */}
        {!isHouse && (
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
        )}

        {/* ── BASE_ZONES interactive buttons ───────────────────────────────── */}
        {BASE_ZONES.map((z) => (
          <button
            key={z.type}
            type="button"
            onClick={() => goToZone(z)}
            className={
              isHouse
                ? [
                    "absolute rounded-xl transition-all duration-200",
                    activeSubRoom === z.type
                      ? "ring-4 ring-plum-500/70 shadow-[0_0_22px_8px_rgba(147,51,234,0.28)]"
                      : "hover:ring-2 hover:ring-plum-400/50 hover:shadow-[0_0_18px_6px_rgba(147,51,234,0.22)] hover:bg-plum-300/8",
                  ].join(" ")
                : [
                    "absolute rounded-xl border-2 border-cozy-400/50 transition hover:brightness-95 hover:ring-2 hover:ring-plum-400",
                    activeSubRoom === z.type ? "ring-4 ring-plum-500" : "",
                  ].join(" ")
            }
            style={{
              left: z.x,
              top: z.y,
              width: z.w,
              height: z.h,
              backgroundColor: isHouse ? "transparent" : z.color,
            }}
          >
            {/* Non-house: centred label */}
            {!isHouse && (
              <>
                <span className="text-xs font-bold text-cozy-800">{z.label}</span>
                <span className="mt-1 block text-[10px] text-cozy-600">Click to walk here</span>
              </>
            )}
          </button>
        ))}

        {/* ── Personal zone buttons ─────────────────────────────────────────── */}
        {personalZones.map((z) => {
          const isOwner = z.ownerId === user?.id;
          const canEnter = !!user && canEnterPersonalRoom(roomId, z.ownerId, user.id);
          const isActivePersonal =
            activeSubRoom === "personal" && activePersonalOwner === z.ownerId;

          const zoneButtonClass = isHouse
            ? [
                "absolute overflow-visible rounded-xl transition-all duration-200",
                isActivePersonal
                  ? "ring-2 ring-plum-500 shadow-[0_0_16px_5px_rgba(147,51,234,0.22)]"
                  : "hover:ring-2 hover:ring-indigo-400/50 hover:shadow-[0_0_14px_4px_rgba(99,102,241,0.2)]",
              ].join(" ")
            : [
                "absolute overflow-hidden rounded-xl border-2 border-indigo-200 transition hover:brightness-95 hover:ring-2 hover:ring-indigo-300",
                isActivePersonal ? "ring-2 ring-plum-500" : "",
              ].join(" ");

          return (
            <button
              key={`personal-${z.ownerId}`}
              type="button"
              onClick={() => {
                goToZone(z);
                if (isOwner) {
                  onOpenOwnMailbox?.();
                } else {
                  onPersonalRoomZoneEnter?.(z.ownerId);
                }
              }}
              onMouseEnter={() => {
                if (!isOwner) onPersonalRoomHover?.(z.ownerId);
              }}
              onMouseLeave={() => {
                if (!isOwner) onPersonalRoomHoverEnd?.();
              }}
              title={getRoomDisplayName(roomId, z.ownerId)}
              className={`${zoneButtonClass} z-20`}
              style={{
                left: z.x,
                top: z.y,
                width: z.w,
                height: z.h,
                backgroundColor: isHouse ? "transparent" : z.color,
              }}
            >
              {!isHouse && (
                <div className="relative z-10 flex h-full flex-col items-center justify-center px-2 text-center">
                  <p className="truncate text-[11px] font-bold text-indigo-900">
                    {getRoomDisplayName(roomId, z.ownerId)}
                  </p>
                  <p className="truncate text-[10px] text-indigo-700">
                    {users.find((u) => u.id === z.ownerId)?.displayName ?? "Friend"}
                  </p>
                  <p className="mt-0.5 text-[9px] text-indigo-500">
                    {isOwner ? "Your room" : canEnter ? "Enter" : "Visit"}
                  </p>
                </div>
              )}
              {!isOwner && (
                <span className="pointer-events-none absolute right-1 top-1 text-sm">📬</span>
              )}
            </button>
          );
        })}

        {/* ── Other players ─────────────────────────────────────────────────── */}
        {others.map((o) => {
          const member = users.find((u) => u.id === o.id);
          const avatar = member ? getDisplayAvatar(member) : DEFAULT_AVATAR;
          return (
            <div
              key={o.id}
              className="pointer-events-none absolute z-[5] flex flex-col items-center transition-[left,top] duration-100 ease-linear"
              style={{
                left: o.x,
                top: o.y,
                transform: "translate(-50%, -85%)",
              }}
            >
              <div className="relative">
                <AvatarPreview avatar={avatar} size="sm" label={o.name} />
                {o.inVoice && (
                  <span
                    className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-plum-600 text-[8px] text-white shadow"
                    title="In voice chat"
                  >
                    🎙️
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* ── Current user avatar ───────────────────────────────────────────── */}
        {user && (
          <div
            className="pointer-events-none absolute z-10 flex flex-col items-center"
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

      {/* ── Controls ──────────────────────────────────────────────────────────── */}
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
      </div>

      {voiceContext &&
        (activeSubRoom === "living" ||
          (activeSubRoom === "personal" && activePersonalOwner)) && (
          <VoiceChatPanel
            title={voiceContext.title}
            description=""
            participantNames={voiceContext.participantNames}
            voice={voiceContext.voice}
            compact
          />
        )}
    </div>
  );
}
