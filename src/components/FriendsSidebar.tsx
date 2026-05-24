import { useState } from "react";
import { useApp } from "../context/AppContext";
import { AvatarPreview } from "./AvatarPreview";
import { ConfirmDialog } from "./ConfirmDialog";
import { presenceDotClass, presenceLabel } from "../types";

export function FriendsSidebar() {
  const { user, users, friendRequests, addFriendByEmail, respondToFriendRequest, removeFriend } =
    useApp();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [unfriendTarget, setUnfriendTarget] = useState<{
    id: string;
    displayName: string;
  } | null>(null);
  const [unfriending, setUnfriending] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  if (!user) return null;

  const friends = users.filter((u) => user.friendIds.includes(u.id));

  const incomingRequests = friendRequests.filter(
    (r) =>
      r.status === "pending" &&
      r.requestedBy !== user.id &&
      (r.userId === user.id || r.friendId === user.id)
  );

  const outgoingRequests = friendRequests.filter(
    (r) =>
      r.status === "pending" &&
      r.requestedBy === user.id &&
      (r.userId === user.id || r.friendId === user.id)
  );

  const otherUserId = (r: (typeof friendRequests)[0]) =>
    r.userId === user.id ? r.friendId : r.userId;

  const handleAdd = async () => {
    const result = await addFriendByEmail(email);
    if (result.ok) {
      setEmail("");
      setMsg("Friend request sent!");
    } else {
      setMsg(result.error ?? "Error");
    }
    setTimeout(() => setMsg(""), 3000);
  };

  const handleRespond = async (otherId: string, accept: boolean) => {
    setRespondingId(otherId);
    const result = await respondToFriendRequest(otherId, accept);
    setRespondingId(null);
    setMsg(result.ok ? (accept ? "Friend added!" : "Request declined.") : (result.error ?? "Error"));
    setTimeout(() => setMsg(""), 3000);
  };

  const handleCancelOutgoing = async (otherId: string) => {
    setRespondingId(otherId);
    const result = await respondToFriendRequest(otherId, false);
    setRespondingId(null);
    setMsg(result.ok ? "Request cancelled." : (result.error ?? "Error"));
    setTimeout(() => setMsg(""), 3000);
  };

  const confirmUnfriend = async () => {
    if (!unfriendTarget) return;
    setUnfriending(true);
    const result = await removeFriend(unfriendTarget.id);
    setUnfriending(false);
    setUnfriendTarget(null);
    setMsg(result.ok ? "Friend removed." : (result.error ?? "Error"));
    setTimeout(() => setMsg(""), 3000);
  };

  return (
    <>
      <aside className="card flex h-fit flex-col gap-4 lg:sticky lg:top-24">
        <h2 className="font-display text-lg font-semibold text-cozy-900">Friends</h2>

        <div className="flex gap-2">
          <input
            className="input-field text-sm"
            placeholder="Invite by email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="button" className="btn-primary shrink-0 px-3 text-sm" onClick={handleAdd}>
            Send request
          </button>
        </div>
        {msg && <p className="text-xs text-plum-600">{msg}</p>}

        {incomingRequests.length > 0 && (
          <div className="rounded-xl border border-plum-200 bg-plum-50/50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-plum-700">
              Incoming requests
            </p>
            <ul className="mt-2 space-y-2">
              {incomingRequests.map((r) => {
                const fromId = otherUserId(r);
                const from = users.find((u) => u.id === fromId);
                return (
                  <li key={`${r.userId}:${r.friendId}`} className="flex items-center gap-2">
                    <AvatarPreview avatar={from?.avatar ?? user.avatar} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {from?.displayName ?? "User"}
                    </span>
                    <button
                      type="button"
                      className="rounded-lg bg-plum-600 px-2 py-1 text-xs text-white hover:bg-plum-700"
                      disabled={respondingId === fromId}
                      onClick={() => void handleRespond(fromId, true)}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-cozy-200 px-2 py-1 text-xs hover:bg-cozy-50"
                      disabled={respondingId === fromId}
                      onClick={() => void handleRespond(fromId, false)}
                    >
                      Decline
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {outgoingRequests.length > 0 && (
          <div className="rounded-xl border border-cozy-200 bg-cozy-50/80 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-cozy-700">
              Sent requests
            </p>
            <p className="mt-0.5 text-xs text-cozy-500">Waiting for them to accept.</p>
            <ul className="mt-2 space-y-2">
              {outgoingRequests.map((r) => {
                const toId = otherUserId(r);
                const to = users.find((u) => u.id === toId);
                return (
                  <li key={`out-${r.userId}:${r.friendId}`} className="flex items-center gap-2">
                    <AvatarPreview avatar={to?.avatar ?? user.avatar} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{to?.displayName ?? "User"}</p>
                      <p className="truncate text-xs text-cozy-500">{to?.email ?? ""}</p>
                    </div>
                    <button
                      type="button"
                      className="shrink-0 rounded-lg border border-cozy-200 px-2 py-1 text-xs text-cozy-600 hover:bg-white"
                      disabled={respondingId === toId}
                      onClick={() => void handleCancelOutgoing(toId)}
                    >
                      Cancel
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <ul className="max-h-80 space-y-3 overflow-y-auto">
          {friends.length === 0 ? (
            <li className="text-sm text-cozy-500">
              No friends yet. Add friends by email in the sidebar.
            </li>
          ) : (
            friends.map((f) => (
              <li
                key={f.id}
                className="flex items-center gap-3 rounded-xl border border-cozy-100 p-2"
              >
                <AvatarPreview avatar={f.avatar} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{f.displayName}</p>
                  <p className="flex items-center gap-1 text-xs text-cozy-500">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${presenceDotClass(f.presence)}`}
                    />
                    {presenceLabel(f.presence)}
                  </p>
                </div>
                <button
                  type="button"
                  title="Unfriend"
                  className="shrink-0 rounded-lg px-2 py-1 text-xs text-cozy-500 hover:bg-cozy-100 hover:text-cozy-800"
                  onClick={() => setUnfriendTarget({ id: f.id, displayName: f.displayName })}
                >
                  ✕
                </button>
              </li>
            ))
          )}
        </ul>
      </aside>

      <ConfirmDialog
        open={unfriendTarget !== null}
        title="Remove friend?"
        message={
          unfriendTarget
            ? `Are you sure you want to remove ${unfriendTarget.displayName} from your friends?`
            : ""
        }
        confirmLabel="Unfriend"
        danger
        loading={unfriending}
        onConfirm={() => void confirmUnfriend()}
        onCancel={() => !unfriending && setUnfriendTarget(null)}
      />
    </>
  );
}
