import { useState } from "react";
import { useApp } from "../context/AppContext";

interface Props {
  roomId: string;
  memberIds: string[];
}

export function RoomNicknamesPanel({ roomId, memberIds }: Props) {
  const {
    user,
    users,
    nicknameRequests,
    setRoomNickname,
    requestNicknameForFriend,
    respondNicknameRequest,
    getRoomDisplayName,
  } = useApp();
  const [myNick, setMyNick] = useState("");
  const [friendId, setFriendId] = useState("");
  const [suggestedNick, setSuggestedNick] = useState("");

  if (!user) return null;

  const members = users.filter((u) => memberIds.includes(u.id) && u.id !== user.id);
  const pendingForMe = nicknameRequests.filter(
    (r) => r.toUserId === user.id && r.roomId === roomId && r.status === "pending"
  );

  return (
    <div className="card mt-4 space-y-4">
      <h4 className="font-semibold text-cozy-900">Room nicknames</h4>
      <p className="text-sm text-cozy-600">
        Set your display name for this room, or suggest nicknames for friends.
      </p>

      <div className="flex gap-2">
        <input
          className="input-field flex-1"
          placeholder="Your nickname in this room"
          value={myNick}
          onChange={(e) => setMyNick(e.target.value)}
        />
        <button
          type="button"
          className="btn-primary shrink-0"
          onClick={() => {
            setRoomNickname(roomId, user.id, myNick);
            setMyNick("");
          }}
        >
          Save
        </button>
      </div>

      <ul className="text-sm">
        {memberIds.map((id) => (
          <li key={id} className="flex justify-between border-b border-cozy-100 py-1">
            <span className="text-cozy-600">
              {users.find((u) => u.id === id)?.displayName}
            </span>
            <span className="font-medium">{getRoomDisplayName(roomId, id)}</span>
          </li>
        ))}
      </ul>

      <div className="border-t border-cozy-200 pt-3">
        <p className="mb-2 text-sm font-medium">Suggest a nickname for a friend</p>
        <select
          className="input-field mb-2"
          value={friendId}
          onChange={(e) => setFriendId(e.target.value)}
        >
          <option value="">Choose friend</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.displayName}
            </option>
          ))}
        </select>
        <input
          className="input-field mb-2"
          placeholder="Suggested nickname"
          value={suggestedNick}
          onChange={(e) => setSuggestedNick(e.target.value)}
        />
        <button
          type="button"
          className="btn-secondary w-full text-sm"
          disabled={!friendId || !suggestedNick.trim()}
          onClick={() => {
            requestNicknameForFriend(roomId, friendId, suggestedNick);
            setSuggestedNick("");
          }}
        >
          Send nickname request
        </button>
      </div>

      {pendingForMe.length > 0 && (
        <div className="rounded-xl bg-plum-50 p-3">
          <p className="text-sm font-medium text-plum-800">Nickname requests for you</p>
          {pendingForMe.map((r) => {
            const from = users.find((u) => u.id === r.fromUserId);
            return (
              <div key={r.id} className="mt-2 flex items-center justify-between text-sm">
                <span>
                  {from?.displayName} suggests: <strong>{r.suggestedNickname}</strong>
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="rounded bg-plum-600 px-2 py-0.5 text-xs text-white"
                    onClick={() => respondNicknameRequest(r.id, true)}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="rounded bg-cozy-200 px-2 py-0.5 text-xs"
                    onClick={() => respondNicknameRequest(r.id, false)}
                  >
                    Decline
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
