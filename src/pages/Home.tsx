import { Link, Navigate } from "react-router-dom";
import { FriendsSidebar } from "../components/FriendsSidebar";
import { Navbar } from "../components/Navbar";
import { RoomCard } from "../components/RoomCard";
import { useApp } from "../context/AppContext";

export function Home() {
  const { user, rooms } = useApp();

  if (!user) return <Navigate to="/" replace />;

  const myRooms = rooms.filter((r) => r.memberIds.includes(user.id));

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl font-bold text-cozy-900">
                  Your virtual areas
                </h1>
                <p className="text-sm text-cozy-600">
                  Hang out online without needing a reason — max 8 people per room.
                </p>
              </div>
              <Link to="/create-room" className="btn-primary">
                + Create new room
              </Link>
            </div>

            {myRooms.length === 0 ? (
              <div className="card mt-8 text-center">
                <p className="text-cozy-600">No rooms yet. Create your first virtual hangout!</p>
                <Link to="/create-room" className="btn-primary mt-4 inline-block">
                  Create a room
                </Link>
              </div>
            ) : (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {myRooms.map((room) => (
                  <RoomCard key={room.id} room={room} />
                ))}
              </div>
            )}
          </div>
          <div className="w-full lg:w-72">
            <FriendsSidebar />
          </div>
        </div>
      </main>
    </>
  );
}
