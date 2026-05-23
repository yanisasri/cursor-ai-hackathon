import { Link, Navigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

export function Landing() {
  const { user } = useApp();

  if (user) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-br from-plum-700 via-plum-600 to-cozy-400 px-6 py-20 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="font-display text-4xl font-bold sm:text-5xl">Hangout Hub</h1>
          <p className="mt-4 text-lg opacity-95">
            A low-pressure social space that makes hanging out effortless again.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm opacity-90">
            Cozy virtual rooms, shared calendars, voice chat, and decision tools — so
            coordinating with friends feels light, not exhausting.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/sign-in" className="btn-primary bg-white text-plum-700 hover:bg-cozy-50">
              Sign in
            </Link>
            <Link
              to="/sign-up"
              className="rounded-xl border-2 border-white bg-white/15 px-5 py-2.5 font-medium text-white shadow-md backdrop-blur transition hover:bg-white hover:text-plum-700"
            >
              Create account
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="font-display text-center text-2xl font-semibold text-cozy-900">
          What makes it different
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Avatar spaces", desc: "Custom avatars in bird's-eye virtual hangouts" },
            { title: "Shared calendar", desc: "See when friends are free — less scheduling friction" },
            { title: "Decision tools", desc: "Polls, wheel, tier lists & swipe cards" },
            { title: "Private rooms", desc: "Personal spaces with request-to-enter" },
          ].map((f) => (
            <div key={f.title} className="card text-center">
              <h3 className="font-semibold text-plum-700">{f.title}</h3>
              <p className="mt-2 text-sm text-cozy-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
