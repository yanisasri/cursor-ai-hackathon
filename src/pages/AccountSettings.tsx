import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AvatarPreview } from "../components/AvatarPreview";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Navbar } from "../components/Navbar";
import { useApp } from "../context/AppContext";

export function AccountSettings() {
  const { user, users, removeFriend, deleteAccount } = useApp();
  const navigate = useNavigate();
  const [friendMsg, setFriendMsg] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [unfriendTarget, setUnfriendTarget] = useState<{
    id: string;
    displayName: string;
  } | null>(null);
  const [unfriending, setUnfriending] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  if (!user) return <Navigate to="/sign-in" replace />;

  const friends = users.filter((u) => user.friendIds.includes(u.id));

  const confirmUnfriend = async () => {
    if (!unfriendTarget) return;
    setUnfriending(true);
    const result = await removeFriend(unfriendTarget.id);
    setUnfriending(false);
    setUnfriendTarget(null);
    if (result.ok) {
      setFriendMsg(`Removed ${unfriendTarget.displayName} from your friends.`);
    } else {
      setFriendMsg(result.error ?? "Could not remove friend.");
    }
    setTimeout(() => setFriendMsg(""), 3000);
  };

  const requestDeleteAccount = () => {
    setDeleteError("");
    if (confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()) {
      setDeleteError("Email does not match your account.");
      return;
    }
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteAccount = async () => {
    setDeleting(true);
    const result = await deleteAccount();
    setDeleting(false);
    setDeleteConfirmOpen(false);
    if (result.ok) {
      navigate("/");
    } else {
      setDeleteError(result.error ?? "Could not delete account.");
    }
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="font-display text-2xl font-bold text-cozy-900">Account settings</h1>
        <p className="mt-1 text-sm text-cozy-600">Manage your profile, friends, and account.</p>

        <section className="card mt-8">
          <h2 className="font-display text-lg font-semibold text-cozy-900">Profile</h2>
          <div className="mt-4 flex items-center gap-4">
            <AvatarPreview avatar={user.avatar} size="md" />
            <div className="min-w-0">
              <p className="font-medium text-cozy-900">{user.displayName}</p>
              <p className="truncate text-sm text-cozy-600">{user.email}</p>
            </div>
          </div>
          <Link to="/edit-avatar" className="btn-secondary mt-4 inline-block text-sm">
            Edit avatar
          </Link>
        </section>

        <section className="card mt-6">
          <h2 className="font-display text-lg font-semibold text-cozy-900">Friends</h2>
          <p className="mt-1 text-sm text-cozy-600">
            Remove someone from your friends list. You can add them again later by email.
          </p>
          {friendMsg && <p className="mt-3 text-sm text-plum-600">{friendMsg}</p>}
          <ul className="mt-4 space-y-3">
            {friends.length === 0 ? (
              <li className="text-sm text-cozy-500">No friends yet.</li>
            ) : (
              friends.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-cozy-100 p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <AvatarPreview avatar={f.avatar} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{f.displayName}</p>
                      <p className="truncate text-xs text-cozy-500">{f.email}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 rounded-lg border border-cozy-200 px-3 py-1.5 text-sm text-cozy-700 hover:bg-cozy-50"
                    onClick={() => setUnfriendTarget({ id: f.id, displayName: f.displayName })}
                  >
                    Unfriend
                  </button>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="card mt-6 border-red-100">
          <h2 className="font-display text-lg font-semibold text-red-700">Delete account</h2>
          <p className="mt-1 text-sm text-cozy-600">
            Permanently delete your account, avatar, friendships, and rooms you own. This
            cannot be undone.
          </p>
          {deleteError && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {deleteError}
            </p>
          )}
          <label className="mt-4 block text-sm font-medium text-cozy-700">
            Type your email to confirm
            <input
              type="email"
              className="input-field mt-1"
              placeholder={user.email}
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              autoComplete="off"
            />
          </label>
          <button
            type="button"
            disabled={deleting || !confirmEmail.trim()}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={requestDeleteAccount}
          >
            Delete my account
          </button>
        </section>
      </main>

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

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete account?"
        message="Are you sure you want to delete your account? All of your data will be permanently removed and this cannot be undone."
        confirmLabel="Delete account"
        danger
        loading={deleting}
        onConfirm={() => void confirmDeleteAccount()}
        onCancel={() => !deleting && setDeleteConfirmOpen(false)}
      />
    </>
  );
}
