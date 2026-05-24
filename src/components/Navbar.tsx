import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { AvatarPreview } from "./AvatarPreview";
import { presenceDotClass, presenceLabel, type UserPresence } from "../types";

export function Navbar() {
  const { user, notifications, signOut, markNotificationRead, setPresence } = useApp();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  if (!user) return null;

  const unread = notifications.filter((n) => n.userId === user.id && !n.read);

  return (
    <header className="sticky top-0 z-50 border-b border-cozy-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/home" className="font-display text-xl font-bold text-plum-700">
          Hangout Hub
        </Link>

        <nav className="flex items-center gap-3">
          <Link to="/home" className="text-sm font-medium text-cozy-700 hover:text-plum-600">
            My Rooms
          </Link>
          <Link
            to="/create-room"
            className="hidden rounded-lg bg-plum-100 px-3 py-1.5 text-sm font-medium text-plum-700 sm:inline"
          >
            + New Room
          </Link>

          <div className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative rounded-lg p-2 hover:bg-cozy-100"
              aria-label="Notifications"
            >
              🔔
              {unread.length > 0 && (
                <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                  {unread.length}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl border border-cozy-200 bg-white p-2 shadow-lg">
                <p className="px-2 py-1 text-xs font-semibold text-cozy-500">Notifications</p>
                {notifications.filter((n) => n.userId === user.id).length === 0 ? (
                  <p className="p-3 text-sm text-cozy-500">No notifications yet.</p>
                ) : (
                  notifications
                    .filter((n) => n.userId === user.id)
                    .slice(0, 8)
                    .map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => markNotificationRead(n.id)}
                        className={`w-full rounded-lg px-2 py-2 text-left text-sm ${
                          n.read ? "text-cozy-500" : "bg-plum-50 font-medium"
                        }`}
                      >
                        <span className="text-xs uppercase text-plum-600">{n.type}</span>
                        <p>{n.title}</p>
                        <p className="text-xs text-cozy-600">{n.message}</p>
                      </button>
                    ))
                )}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 rounded-xl border border-cozy-200 px-2 py-1 hover:bg-cozy-50"
            >
              <AvatarPreview avatar={user.avatar} size="sm" />
              <span className="hidden text-sm sm:inline">Account</span>
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-cozy-200 bg-white p-3 shadow-lg">
                <p className="truncate text-sm text-cozy-600">{user.email}</p>
                <div className="mt-3">
                  <p className="text-xs font-medium text-cozy-500">Your status</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(["online", "idle", "offline"] as UserPresence[]).map((status) => (
                      <button
                        key={status}
                        type="button"
                        className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs ${
                          user.presence === status
                            ? "bg-plum-100 font-medium text-plum-800"
                            : "text-cozy-600 hover:bg-cozy-50"
                        }`}
                        onClick={() => setPresence(status)}
                      >
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${presenceDotClass(status)}`}
                        />
                        {presenceLabel(status)}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-secondary mt-3 w-full text-sm"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/account");
                  }}
                >
                  Account settings
                </button>
                <button
                  type="button"
                  className="btn-secondary mt-2 w-full text-sm"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/edit-avatar");
                  }}
                >
                  Edit Avatar
                </button>
                <button
                  type="button"
                  className="mt-2 w-full rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  onClick={() => {
                    signOut();
                    navigate("/");
                  }}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
