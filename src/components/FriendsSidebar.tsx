import { useState } from "react";
import { useApp } from "../context/AppContext";
import { AvatarPreview } from "./AvatarPreview";

export function FriendsSidebar() {
  const { user, users, addFriendByEmail } = useApp();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  if (!user) return null;

  const friends = users.filter((u) => user.friendIds.includes(u.id));

  const handleAdd = async () => {
    const result = await addFriendByEmail(email);
    if (result.ok) {
      setEmail("");
      setMsg("Friend added!");
    } else {
      setMsg(result.error ?? "Error");
    }
    setTimeout(() => setMsg(""), 3000);
  };

  return (
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
          Add
        </button>
      </div>
      {msg && <p className="text-xs text-plum-600">{msg}</p>}

      <ul className="max-h-80 space-y-3 overflow-y-auto">
        {friends.length === 0 ? (
          <li className="text-sm text-cozy-500">
            No friends yet. Demo friends are added when you sign up.
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
                    className={`inline-block h-2 w-2 rounded-full ${
                      f.online ? "bg-green-500" : "bg-cozy-300"
                    }`}
                  />
                  {f.online ? "Online" : "Offline"}
                </p>
              </div>
            </li>
          ))
        )}
      </ul>
    </aside>
  );
}
