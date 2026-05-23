import { Navigate, useNavigate } from "react-router-dom";
import { AvatarEditor } from "../components/AvatarEditor";
import { useApp } from "../context/AppContext";

export function AvatarSetup() {
  const { user, updateAvatar } = useApp();
  const navigate = useNavigate();

  if (!user) return <Navigate to="/sign-up" replace />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-plum-700">Create your avatar</h1>
      <p className="mt-2 text-cozy-600">
        Choose your hairstyle, clothes, and colors — you can edit these anytime.
      </p>
      <div className="mt-8">
        <AvatarEditor
          initial={user.avatar}
          submitLabel="Continue to Home"
          onSave={(avatar) => {
            updateAvatar(avatar);
            navigate("/home");
          }}
        />
      </div>
    </div>
  );
}
