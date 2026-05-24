import { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { useApp } from "../context/AppContext";
import { MAX_ROOM_MEMBERS, ROOM_AREAS } from "../types";
import type { RoomArea } from "../types";

export function CreateRoom() {
  const { user, users, createRoom } = useApp();
  const navigate = useNavigate();
  const [area, setArea] = useState<RoomArea>("house");
  const [name, setName] = useState("");
  const [maxMembers, setMaxMembers] = useState(8);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [myNickname, setMyNickname] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState("");

  const friends = user
    ? users.filter((u) => user.friendIds.includes(u.id))
    : [];

  useEffect(() => {
    if (!initialized && friends.length > 0) {
      setSelectedFriends(friends.map((f) => f.id));
      setInitialized(true);
    }
  }, [friends, initialized]);

  if (!user) return <Navigate to="/sign-in" replace />;

  const toggleFriend = (id: string) => {
    setSelectedFriends((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError("");
    try {
      const room = await createRoom({
        name: name.trim(),
        area,
        maxMembers,
        friendIds: selectedFriends,
        myNickname: myNickname.trim() || undefined,
      });
      navigate(`/room/${room.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to create room right now.";
      setError(message);
    }
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="font-display text-2xl font-bold">Create a new room</h1>
        <form onSubmit={handleSubmit} className="card mt-6 space-y-6">
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          <div>
            <p className="mb-2 text-sm font-medium">1. Pick an area</p>
            <div className="grid grid-cols-2 gap-3">
              {ROOM_AREAS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setArea(a.id)}
                  className={`rounded-xl border-2 p-4 text-left ${
                    area === a.id ? "border-plum-500 bg-plum-50" : "border-cozy-200"
                  }`}
                >
                  <span className="text-2xl">{a.emoji}</span>
                  <p className="mt-1 font-medium">{a.label}</p>
                </button>
              ))}
            </div>
          </div>

          <label className="block text-sm font-medium">
            2. Virtual room name
            <input
              className="input-field mt-1"
              required
              placeholder="Friday Night Crew"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="block text-sm font-medium">
            Your nickname in this room (optional)
            <input
              className="input-field mt-1"
              placeholder="e.g. Captain Chaos"
              value={myNickname}
              onChange={(e) => setMyNickname(e.target.value)}
            />
          </label>

          <label className="block text-sm font-medium">
            3. Max people (up to {MAX_ROOM_MEMBERS})
            <input
              type="number"
              min={2}
              max={MAX_ROOM_MEMBERS}
              className="input-field mt-1 w-24"
              value={maxMembers}
              onChange={(e) =>
                setMaxMembers(
                  Math.min(MAX_ROOM_MEMBERS, Math.max(2, Number(e.target.value)))
                )
              }
            />
          </label>

          <div>
            <p className="mb-2 text-sm font-medium">
              4. Add friends (pre-selected — includes demo friends)
            </p>
            <div className="flex flex-wrap gap-2">
              {friends.length === 0 ? (
                <p className="text-sm text-cozy-500">No friends yet — sign up adds demo friends.</p>
              ) : (
                friends.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggleFriend(f.id)}
                    className={`rounded-lg px-3 py-1.5 text-sm ${
                      selectedFriends.includes(f.id)
                        ? "bg-plum-600 text-white"
                        : "bg-cozy-200"
                    }`}
                  >
                    {f.displayName}
                  </button>
                ))
              )}
            </div>
          </div>

          <button type="submit" className="btn-primary w-full">
            5. Create & enter room
          </button>
        </form>
      </main>
    </>
  );
}
