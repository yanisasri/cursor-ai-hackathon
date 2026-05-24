import { Link, Navigate } from "react-router-dom";
import { FriendsSidebar } from "../components/FriendsSidebar";
import { Navbar } from "../components/Navbar";
import { RoomCard } from "../components/RoomCard";
import { RoomInvitesPanel } from "../components/RoomInvitesPanel";
import { useApp } from "../context/AppContext";

export function Home() {
  const { user, rooms } = useApp();

  if (!user) return <Navigate to="/" replace />;

  const myRooms = rooms.filter((r) => r.memberIds.includes(user.id));

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <section className="mb-8 rounded-2xl bg-gradient-to-r from-plum-600 to-plum-700 px-6 py-8 text-white shadow-lg">
          <p className="text-sm font-medium uppercase tracking-wide opacity-90">
            Your social hub, reimagined
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
            Hang out online — no plan, no pressure, no endless group chat.
          </h1>
          <p className="mt-3 max-w-2xl text-sm opacity-95 sm:text-base">
            Hangout Hub gives you cozy virtual spaces, live friend presence, shared
            calendars, and fun decision tools — everything you need to actually see your
            people again.
          </p>
        </section>

        <RoomInvitesPanel />

        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold text-cozy-900">
                  Your virtual areas
                </h2>
                <p className="text-sm text-cozy-600">
                  Pick a room and drop in — max 8 friends per space.
                </p>
              </div>
              <Link to="/create-room" className="btn-primary">
                + Create new room
              </Link>
            </div>

            {myRooms.length === 0 ? (
              <div className="card mt-8 text-center">
                <p className="text-cozy-600">
                  No rooms yet. Create your first virtual hangout and invite friends!
                </p>
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
