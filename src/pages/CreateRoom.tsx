import { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { useApp } from "../context/AppContext";
import { MAX_ROOM_MEMBERS } from "../types";

export function CreateRoom() {
  const { user, users, createRoom } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [maxMembers, setMaxMembers] = useState(8);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [myNickname, setMyNickname] = useState("");
  const [initialized, setInitialized] = useState(false);

  const friends = user
    ? users.filter((u) => user.friendIds.includes(u.id))
    : [];

  useEffect(() => {
    if (!initialized && friends.length > 0) {
      setSelectedFriends(friends.slice(0, maxMembers - 1).map((f) => f.id));
      setInitialized(true);
    }
  }, [friends, initialized, maxMembers]);

  useEffect(() => {
    setSelectedFriends((prev) => prev.slice(0, maxMembers - 1));
  }, [maxMembers]);

  if (!user) return <Navigate to="/sign-in" replace />;

  const toggleFriend = (id: string) => {
    setSelectedFriends((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= maxMembers - 1) return prev;
      return [...prev, id];
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const room = createRoom({
      name: name.trim(),
      area: "house",
      maxMembers,
      friendIds: selectedFriends,
      myNickname: myNickname.trim() || undefined,
    });
    navigate(`/room/${room.id}`);
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="font-display text-2xl font-bold">Create a new room</h1>
        <p className="mt-1 text-sm text-cozy-600">
          Every room uses the Cozy House map — hang out, plan, and decide together.
        </p>
        <form onSubmit={handleSubmit} className="card mt-6 space-y-6">
          <label className="block text-sm font-medium">
            1. Virtual room name
            <input
              className="input-field mt-1"
              required
              placeholder="Friday Night Crew"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="block text-sm font-medium">
            2. Your nickname in this room (optional)
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
            <span className="mt-1 block text-xs text-cozy-500">
              Includes you — pick up to {maxMembers - 1} friend{maxMembers - 1 === 1 ? "" : "s"} below.
            </span>
          </label>

          <div>
            <p className="mb-2 text-sm font-medium">
              4. Add friends ({selectedFriends.length}/{maxMembers - 1} selected)
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
