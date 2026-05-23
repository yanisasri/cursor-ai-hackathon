import { Link } from "react-router-dom";
import type { VirtualRoom, RoomArea } from "../types";
import { ROOM_AREAS } from "../types";

function RoomPreviewArt({ area }: { area: RoomArea }) {
  switch (area) {
    case "house":
      return (
        <svg viewBox="0 0 320 128" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="house-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fde8d0" />
              <stop offset="100%" stopColor="#d4b89a" />
            </linearGradient>
          </defs>
          <rect width="320" height="128" fill="url(#house-sky)" />
          <rect x="40" y="70" width="90" height="50" fill="#c49a74" rx="2" />
          <polygon points="85,35 25,75 145,75" fill="#8c543e" />
          <rect x="55" y="85" width="20" height="25" fill="#5d3a2f" />
          <rect x="95" y="80" width="18" height="18" fill="#fff8e7" opacity="0.8" />
          <circle cx="250" cy="40" r="22" fill="#ffd166" opacity="0.7" />
          <ellipse cx="260" cy="100" rx="40" ry="12" fill="#81b29a" opacity="0.5" />
        </svg>
      );
    case "office":
      return (
        <svg viewBox="0 0 320 128" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
          <rect width="320" height="128" fill="#e8eef5" />
          <rect x="30" y="30" width="80" height="90" fill="#9bb0c4" />
          <rect x="120" y="45" width="70" height="75" fill="#7a92a8" />
          <rect x="200" y="25" width="90" height="95" fill="#6b8399" />
          {[50, 140, 220].map((x, i) => (
            <g key={i}>
              <rect x={x} y={50 + i * 8} width="12" height="16" fill="#fff8e7" opacity="0.9" />
              <rect x={x + 18} y={55 + i * 6} width="12" height="16" fill="#fff8e7" opacity="0.7" />
            </g>
          ))}
        </svg>
      );
    case "cafe":
      return (
        <svg viewBox="0 0 320 128" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
          <rect width="320" height="128" fill="#f5e6d3" />
          <rect x="0" y="90" width="320" height="38" fill="#c49a74" />
          <rect x="60" y="50" width="200" height="50" fill="#8c543e" rx="4" />
          <rect x="80" y="35" width="160" height="20" fill="#5d3a2f" rx="8" />
          <circle cx="100" cy="75" r="8" fill="#fff" opacity="0.5" />
          <circle cx="140" cy="75" r="8" fill="#fff" opacity="0.5" />
          <path d="M240 60 Q260 40 280 60" stroke="#6b4c35" strokeWidth="3" fill="none" />
          <text x="250" y="100" fontSize="24" fill="#5d3a2f">
            ☕
          </text>
        </svg>
      );
    case "park":
      return (
        <svg viewBox="0 0 320 128" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
          <rect width="320" height="128" fill="#b8e0d2" />
          <ellipse cx="160" cy="110" rx="160" ry="30" fill="#81b29a" />
          <circle cx="80" cy="60" r="35" fill="#52b788" />
          <rect x="72" y="60" width="16" height="50" fill="#40916c" />
          <circle cx="200" cy="50" r="40" fill="#74c69d" />
          <rect x="192" y="50" width="16" height="55" fill="#40916c" />
          <circle cx="280" cy="70" r="25" fill="#95d5b2" />
          <rect x="274" y="70" width="12" height="40" fill="#40916c" />
        </svg>
      );
    default:
      return null;
  }
}

interface Props {
  room: VirtualRoom;
}

export function RoomCard({ room }: Props) {
  const area = ROOM_AREAS.find((a) => a.id === room.area);
  return (
    <Link
      to={`/room/${room.id}`}
      className="group block overflow-hidden rounded-2xl border border-cozy-200 bg-white shadow-sm transition hover:border-plum-300 hover:shadow-lg"
    >
      <div className="relative h-36 overflow-hidden">
        <RoomPreviewArt area={room.area} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <span className="absolute bottom-3 left-3 text-2xl drop-shadow">{area?.emoji}</span>
        <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-cozy-800">
          {room.memberIds.length}/{room.maxMembers}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-cozy-900 group-hover:text-plum-700">{room.name}</h3>
        <p className="text-sm text-cozy-500">{area?.label}</p>
      </div>
    </Link>
  );
}
