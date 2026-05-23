import { Link } from "react-router-dom";
import type { VirtualRoom } from "../types";
import { ROOM_AREAS } from "../types";

const areaPreview: Record<string, string> = {
  house: "linear-gradient(135deg, #f3ebe0 40%, #d4b89a 100%)",
  office: "linear-gradient(135deg, #e8eef5 40%, #9bb0c4 100%)",
  cafe: "linear-gradient(135deg, #f5e6d3 40%, #c49a74 100%)",
  park: "linear-gradient(135deg, #d8f3dc 40%, #81b29a 100%)",
};

interface Props {
  room: VirtualRoom;
}

export function RoomCard({ room }: Props) {
  const area = ROOM_AREAS.find((a) => a.id === room.area);
  return (
    <Link
      to={`/room/${room.id}`}
      className="group block overflow-hidden rounded-2xl border border-cozy-200 bg-white shadow-sm transition hover:border-plum-300 hover:shadow-md"
    >
      <div
        className="relative flex h-32 items-center justify-center text-4xl"
        style={{ background: areaPreview[room.area] }}
      >
        <span>{area?.emoji ?? "🏠"}</span>
        <div className="absolute inset-0 flex items-end justify-center gap-1 p-3 opacity-60">
          <div className="h-8 w-12 rounded bg-white/50" />
          <div className="h-10 w-14 rounded bg-white/60" />
          <div className="h-7 w-10 rounded bg-white/40" />
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-cozy-900 group-hover:text-plum-700">{room.name}</h3>
        <p className="text-sm text-cozy-500">
          {area?.label} · {room.memberIds.length}/{room.maxMembers} people
        </p>
      </div>
    </Link>
  );
}
