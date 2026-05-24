import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { AccountSettings } from "./pages/AccountSettings";
import { AvatarSetup } from "./pages/AvatarSetup";
import { CreateRoom } from "./pages/CreateRoom";
import { EditAvatar } from "./pages/EditAvatar";
import { Home } from "./pages/Home";
import { Landing } from "./pages/Landing";
import { SignIn } from "./pages/SignIn";
import { SignUp } from "./pages/SignUp";
import { VirtualRoomPage } from "./pages/VirtualRoomPage";

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/avatar-setup" element={<AvatarSetup />} />
          <Route path="/home" element={<Home />} />
          <Route path="/create-room" element={<CreateRoom />} />
          <Route path="/edit-avatar" element={<EditAvatar />} />
          <Route path="/account" element={<AccountSettings />} />
          <Route path="/room/:roomId" element={<VirtualRoomPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
