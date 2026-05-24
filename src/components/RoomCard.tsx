import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import type { VirtualRoom, RoomArea } from "../types";
import { AvatarPreview } from "./AvatarPreview";
import { ConfirmDialog } from "./ConfirmDialog";

const AREA_GRADIENT: Record<RoomArea, string> = {
  house: "from-[#fde8d0] to-[#d4b89a]",
  office: "from-[#e8eef5] to-[#9bb0c4]",
  cafe: "from-[#f5e6d3] to-[#c49a74]",
  park: "from-[#b8e0d2] to-[#81b29a]",
};

function RoomMemberPreview({
  memberIds,
  area,
}: {
  memberIds: string[];
  area: RoomArea;
}) {
  const { users } = useApp();
  const members = memberIds
    .map((id) => users.find((u) => u.id === id))
    .filter((u): u is NonNullable<typeof u> => Boolean(u));

  const visible = members.slice(0, 6);
  const overflow = members.length - visible.length;

  return (
    <div
      className={`flex h-full items-center justify-center bg-gradient-to-b ${AREA_GRADIENT[area]}`}
    >
      {members.length === 0 ? (
        <span className="text-sm text-cozy-700/60">No members yet</span>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-2.5 px-3">
          {visible.map((member) => (
            <div
              key={member.id}
              className="rounded-full bg-white/80 p-1 shadow-md ring-2 ring-white"
              title={member.displayName}
            >
              <AvatarPreview avatar={member.avatar} size="md" scale={0.92} />
            </div>
          ))}
          {overflow > 0 && (
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-sm font-semibold text-cozy-700 shadow-md ring-2 ring-white"
              title={`${overflow} more member${overflow === 1 ? "" : "s"}`}
            >
              +{overflow}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface Props {
  room: VirtualRoom;
}

export function RoomCard({ room }: Props) {
  const { leaveRoom } = useApp();
  const navigate = useNavigate();
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

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

  return (
    <>
      <div className="group relative overflow-hidden rounded-2xl border border-cozy-200 bg-white shadow-sm transition hover:border-plum-300 hover:shadow-lg">
        <Link to={`/room/${room.id}`} className="block">
          <div className="relative h-36 overflow-hidden">
            <RoomMemberPreview memberIds={room.memberIds} area={room.area} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-cozy-800">
              {room.memberIds.length}/{room.maxMembers}
            </span>
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-cozy-900 group-hover:text-plum-700">{room.name}</h3>
          </div>
        </Link>
        <button
          type="button"
          title="Leave room"
          className="absolute right-3 top-3 rounded-lg bg-white/90 px-2 py-1 text-xs text-red-700 opacity-0 shadow transition hover:bg-red-50 group-hover:opacity-100"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setLeaveConfirmOpen(true);
          }}
        >
          Leave
        </button>
      </div>

      <ConfirmDialog
        open={leaveConfirmOpen}
        title="Leave room?"
        message={
          willDeleteRoom
            ? `Are you sure you want to leave "${room.name}"? The room will be deleted because only one member would remain.`
            : `Are you sure you want to leave "${room.name}"?`
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
