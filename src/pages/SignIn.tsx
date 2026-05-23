import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

export function SignIn() {
  const { signIn } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = signIn(email, password);
    if (result.ok) {
      navigate("/home");
    } else {
      setError(result.error ?? "Sign in failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="card w-full max-w-md">
        <h1 className="font-display text-2xl font-bold text-plum-700">Sign in</h1>
        <p className="mt-1 text-sm text-cozy-600">Welcome back to Hangout Hub</p>

        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <label className="mt-6 block text-sm font-medium">
          Email
          <input
            type="email"
            required
            className="input-field mt-1"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Password
          <input
            type="password"
            required
            className="input-field mt-1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <button type="submit" className="btn-primary mt-6 w-full">
          Sign in
        </button>

        <p className="mt-4 text-center text-sm text-cozy-600">
          New here?{" "}
          <Link to="/sign-up" className="font-medium text-plum-600 hover:underline">
            Create account
          </Link>
        </p>
      </form>
    </div>
  );
}
