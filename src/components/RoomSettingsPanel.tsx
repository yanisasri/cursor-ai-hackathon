import { useState } from "react";
import { useApp } from "../context/AppContext";

interface Props {
  roomId: string;
  memberIds: string[];
}

export function RoomSettingsPanel({ roomId, memberIds }: Props) {
  const {
    user,
    users,
    rooms,
    roomInvites,
    roomNameChangeRequests,
    sendRoomInvite,
    proposeRoomNameChange,
    respondToRoomNameChange,
  } = useApp();

  const [inviteFriendId, setInviteFriendId] = useState("");
  const [inviteMsg, setInviteMsg] = useState("");
  const [inviting, setInviting] = useState(false);
  const [newName, setNewName] = useState("");
  const [renameMsg, setRenameMsg] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  if (!user) return null;

  const room = rooms.find((r) => r.id === roomId);
  const inviteableFriends = users.filter(
    (u) =>
      user.friendIds.includes(u.id) &&
      !memberIds.includes(u.id) &&
      !roomInvites.some(
        (i) =>
          i.roomId === roomId &&
          i.toUserId === u.id &&
          i.status === "pending"
      )
  );

  const pendingRename = roomNameChangeRequests.find(
    (r) => r.roomId === roomId && r.status === "pending"
  );
  const myApproval = pendingRename?.memberApprovals[user.id] ?? null;

  const handleInvite = async () => {
    if (!inviteFriendId) return;
    setInviteMsg("");
    setInviting(true);
    const result = await sendRoomInvite(roomId, inviteFriendId);
    setInviting(false);
    if (result.ok) {
      setInviteFriendId("");
      setInviteMsg("Invite sent!");
    } else {
      setInviteMsg(result.error ?? "Could not send invite.");
    }
    setTimeout(() => setInviteMsg(""), 4000);
  };

  const handleProposeRename = async () => {
    setRenameMsg("");
    setRenaming(true);
    const result = await proposeRoomNameChange(roomId, newName);
    setRenaming(false);
    if (result.ok) {
      setNewName("");
      setRenameMsg("Rename proposed — waiting for all members to approve.");
    } else {
      setRenameMsg(result.error ?? "Could not propose rename.");
    }
    setTimeout(() => setRenameMsg(""), 5000);
  };

  const handleRenameResponse = async (approve: boolean) => {
    if (!pendingRename) return;
    setRespondingId(pendingRename.id);
    const result = await respondToRoomNameChange(pendingRename.id, approve);
    setRespondingId(null);
    setRenameMsg(
      result.ok
        ? approve
          ? "Your approval was recorded."
          : "You declined the rename."
        : (result.error ?? "Could not respond.")
    );
    setTimeout(() => setRenameMsg(""), 4000);
  };

  return (
    <div className="card space-y-4">
      <h4 className="font-semibold text-cozy-900">Room settings</h4>

      <section className="border-t border-cozy-100 pt-3">
        <p className="text-sm font-medium text-cozy-800">Invite a friend</p>
        <p className="mt-1 text-xs text-cozy-500">
          Send an invite to a friend who is not in this room yet.
        </p>
        {room && room.memberIds.length >= room.maxMembers ? (
          <p className="mt-2 text-sm text-amber-800">This room is full.</p>
        ) : (
          <div className="mt-2 flex gap-2">
            <select
              className="input-field flex-1 text-sm"
              value={inviteFriendId}
              onChange={(e) => setInviteFriendId(e.target.value)}
            >
              <option value="">Choose friend</option>
              {inviteableFriends.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.displayName}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn-primary shrink-0 text-sm"
              disabled={!inviteFriendId || inviting}
              onClick={() => void handleInvite()}
            >
              {inviting ? "Sending…" : "Invite"}
            </button>
          </div>
        )}
        {inviteableFriends.length === 0 && room && room.memberIds.length < room.maxMembers && (
          <p className="mt-2 text-xs text-cozy-500">
            All your friends are already here or have a pending invite.
          </p>
        )}
        {inviteMsg && <p className="mt-2 text-sm text-plum-700">{inviteMsg}</p>}
      </section>

      <section className="border-t border-cozy-100 pt-3">
        <p className="text-sm font-medium text-cozy-800">Rename room</p>
        <p className="mt-1 text-xs text-cozy-500">
          Every member must approve before the name changes.
        </p>

        {pendingRename ? (
          <div className="mt-3 rounded-xl border border-plum-200 bg-plum-50/50 p-3">
            <p className="text-sm text-cozy-700">
              Pending rename to{" "}
              <span className="font-semibold text-plum-800">{pendingRename.proposedName}</span>
            </p>
            <p className="mt-1 text-xs text-cozy-500">
              Proposed by{" "}
              {users.find((u) => u.id === pendingRename.proposedByUserId)?.displayName ??
                "someone"}
            </p>
            <ul className="mt-2 space-y-1 text-xs">
              {memberIds.map((id) => {
                const decision = pendingRename.memberApprovals[id] ?? "pending";
                const name = users.find((u) => u.id === id)?.displayName ?? "Member";
                return (
                  <li key={id} className="flex justify-between text-cozy-600">
                    <span>{name}</span>
                    <span
                      className={
                        decision === "approved"
                          ? "text-green-700"
                          : decision === "declined"
                            ? "text-red-700"
                            : "text-amber-700"
                      }
                    >
                      {decision === "approved"
                        ? "Approved"
                        : decision === "declined"
                          ? "Declined"
                          : "Pending"}
                    </span>
                  </li>
                );
              })}
            </ul>
            {myApproval === "pending" && (
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  className="btn-primary flex-1 text-sm"
                  disabled={respondingId === pendingRename.id}
                  onClick={() => void handleRenameResponse(true)}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="btn-secondary flex-1 text-sm"
                  disabled={respondingId === pendingRename.id}
                  onClick={() => void handleRenameResponse(false)}
                >
                  Decline
                </button>
              </div>
            )}
            {myApproval === "approved" && pendingRename.proposedByUserId !== user.id && (
              <p className="mt-2 text-xs text-green-700">You approved this rename.</p>
            )}
          </div>
        ) : (
          <div className="mt-2 flex gap-2">
            <input
              className="input-field flex-1 text-sm"
              placeholder={room?.name ?? "New room name"}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <button
              type="button"
              className="btn-primary shrink-0 text-sm"
              disabled={!newName.trim() || renaming}
              onClick={() => void handleProposeRename()}
            >
              {renaming ? "Saving…" : "Propose"}
            </button>
          </div>
        )}
        {renameMsg && <p className="mt-2 text-sm text-plum-700">{renameMsg}</p>}
      </section>
    </div>
  );
}
