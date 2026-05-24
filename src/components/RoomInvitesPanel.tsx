import { useState } from "react";
import { useApp } from "../context/AppContext";

export function RoomInvitesPanel() {
  const { user, users, rooms, roomInvites, respondToRoomInvite } = useApp();
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  if (!user) return null;

  const pending = roomInvites.filter(
    (i) => i.toUserId === user.id && i.status === "pending"
  );

  if (pending.length === 0) return null;

  const handleRespond = async (inviteId: string, accept: boolean) => {
    setRespondingId(inviteId);
    const result = await respondToRoomInvite(inviteId, accept);
    setRespondingId(null);
    setMsg(result.ok ? (accept ? "Joined room!" : "Invite declined.") : (result.error ?? "Error"));
    setTimeout(() => setMsg(""), 3000);
  };

  return (
    <section className="card mb-6 border-plum-200 bg-plum-50/40">
      <h2 className="font-display text-lg font-semibold text-plum-900">Room invites</h2>
      <p className="mt-1 text-sm text-cozy-600">Friends invited you to join their rooms.</p>
      <ul className="mt-4 space-y-3">
        {pending.map((invite) => {
          const room = rooms.find((r) => r.id === invite.roomId);
          const from = users.find((u) => u.id === invite.fromUserId);
          return (
            <li
              key={invite.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cozy-200 bg-white p-3"
            >
              <div>
                <p className="font-medium text-cozy-900">{room?.name ?? "Unknown room"}</p>
                <p className="text-sm text-cozy-500">From {from?.displayName ?? "a friend"}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-primary text-sm"
                  disabled={respondingId === invite.id}
                  onClick={() => void handleRespond(invite.id, true)}
                >
                  Accept
                </button>
                <button
                  type="button"
                  className="btn-secondary text-sm"
                  disabled={respondingId === invite.id}
                  onClick={() => void handleRespond(invite.id, false)}
                >
                  Decline
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {msg && <p className="mt-2 text-sm text-plum-700">{msg}</p>}
    </section>
  );
}
