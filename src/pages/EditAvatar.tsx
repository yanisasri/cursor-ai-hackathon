import { Navigate, useNavigate } from "react-router-dom";
import { AvatarEditor } from "../components/AvatarEditor";
import { Navbar } from "../components/Navbar";
import { useApp } from "../context/AppContext";

export function EditAvatar() {
  const { user, updateAvatar } = useApp();
  const navigate = useNavigate();

  if (!user) return <Navigate to="/sign-in" replace />;

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="font-display text-2xl font-bold">Edit avatar</h1>
        <div className="mt-6">
          <AvatarEditor
            initial={user.avatar}
            onSave={(avatar) => {
              updateAvatar(avatar);
              navigate("/home");
            }}
          />
        </div>
      </div>
    </>
  );
}
