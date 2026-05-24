import { Link, Navigate } from "react-router-dom";
import { LandingAppPreview } from "../components/LandingAppPreview";
import { useApp } from "../context/AppContext";
import { SUB_ROOMS } from "../types";

const PAIN_POINTS = [
  "Making plans becomes exhausting",
  "Decision-making in friend groups is chaotic",
  "People default to staying home alone",
];

const KEY_FEATURES = [
  {
    emoji: "🧑‍🎨",
    title: "Avatar-based virtual spaces",
    desc: "Create a customizable avatar and hang out in cozy bird's-eye rooms that feel personal — not like another group chat thread.",
  },
  {
    emoji: "📅",
    title: "Shared availability calendar",
    desc: "See when friends are free at a glance. Coordinate hangouts, study sessions, game nights, and trips without endless back-and-forth.",
  },
  {
    emoji: "🎯",
    title: "Group decision tools",
    desc: "End decision paralysis with polls, a wheel spinner, tier lists, and swipe cards — pick restaurants, movies, activities, and more together.",
  },
  {
    emoji: "🎙️",
    title: "Voice chat & private rooms",
    desc: "Move between living rooms for casual conversation, or step into personal spaces with request-to-enter for low-pressure one-on-one time.",
  },
];

export function Landing() {
  const { user } = useApp();

  if (user) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="min-h-screen">
      {/* Top nav */}
      <header className="absolute inset-x-0 top-0 z-10 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="font-display text-lg font-bold text-white">Hangout Hub</span>
          <div className="flex gap-3">
            <Link
              to="/sign-in"
              className="rounded-lg px-4 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10"
            >
              Sign in
            </Link>
            <Link
              to="/sign-up"
              className="rounded-lg bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white hover:text-plum-700"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-plum-700 via-plum-600 to-cozy-400 px-6 pb-20 pt-24 text-white">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-plum-900/30 blur-2xl" />

        <div className="relative mx-auto max-w-4xl text-center">
          <span className="inline-block rounded-full bg-white/15 px-4 py-1 text-xs font-medium uppercase tracking-wider backdrop-blur">
            Hackathon project · solving real social friction
          </span>
          <h1 className="mt-6 font-display text-4xl font-bold sm:text-5xl lg:text-6xl">
            Hang out online — without needing a reason.
          </h1>
          <p className="mt-5 text-lg opacity-95 sm:text-xl">
            A low-pressure social space that makes hanging out effortless again.
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed opacity-90 sm:text-base">
            People want to connect, but coordinating plans and initiating social interaction
            feels exhausting. Hangout Hub recreates the feeling of casually spending time
            together — through cozy virtual rooms, live presence, shared calendars, and
            lightweight decision tools.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/sign-up" className="btn-primary bg-white text-plum-700 hover:bg-cozy-50">
              Create free account
            </Link>
            <Link
              to="/sign-in"
              className="rounded-xl border-2 border-white bg-white/15 px-5 py-2.5 font-medium text-white shadow-md backdrop-blur transition hover:bg-white hover:text-plum-700"
            >
              Sign in
            </Link>
          </div>

          <LandingAppPreview />
        </div>
      </section>

      {/* Problem */}
      <section className="border-b border-cozy-200 bg-white px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-plum-600">
                The problem
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold text-cozy-900">
                Social connection shouldn&apos;t feel like a chore.
              </h2>
              <p className="mt-4 text-cozy-600 leading-relaxed">
                Many of us struggle to maintain friendships despite being constantly online.
                After the pandemic, social habits shifted toward isolation — spontaneous
                hangouts and casual interaction became less common.
              </p>
              <p className="mt-3 text-cozy-600 leading-relaxed">
                Existing platforms focus on messaging, gaming, or productivity. Few are
                designed to reduce the friction of social planning and encourage low-pressure
                connection.
              </p>
            </div>
            <ul className="space-y-3">
              {PAIN_POINTS.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50/60 px-4 py-3 text-cozy-800"
                >
                  <span className="mt-0.5 text-red-500" aria-hidden>
                    ✕
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="bg-cozy-50 px-6 py-16">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-plum-600">
            Our solution
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold text-cozy-900">
            A virtual social hub for effortless connection
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-cozy-600 leading-relaxed">
            Hangout Hub creates a shared virtual environment where friends can casually spend
            time together, coordinate plans more easily, and maintain friendships through
            lightweight interaction — without the pressure of formal social media or constant
            texting.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              {
                title: "Cozy virtual hangouts",
                desc: "Bird's-eye rooms with avatars that feel like dropping by a friend's place.",
              },
              {
                title: "Collaborative planning",
                desc: "Calendars and decision tools that replace chaotic group chat threads.",
              },
              {
                title: "Real-time presence",
                desc: "See who's online, idle, or offline — and know when to reach out.",
              },
            ].map((item) => (
              <div key={item.title} className="card text-left">
                <h3 className="font-semibold text-plum-700">{item.title}</h3>
                <p className="mt-2 text-sm text-cozy-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key features */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-plum-600">
              Key features
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold text-cozy-900">
              Everything you need to actually see your people
            </h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {KEY_FEATURES.map((f) => (
              <div key={f.title} className="card flex gap-4">
                <span className="text-3xl" aria-hidden>
                  {f.emoji}
                </span>
                <div>
                  <h3 className="font-semibold text-plum-700">{f.title}</h3>
                  <p className="mt-2 text-sm text-cozy-600 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Room types */}
      <section className="border-y border-cozy-200 bg-gradient-to-b from-plum-50/80 to-cozy-50 px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-plum-600">
              Inside every room
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold text-cozy-900">
              Dedicated spaces for every kind of hangout
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-cozy-600">
              Each virtual room includes sub-spaces so your group can move naturally between
              planning, chatting, and deciding — just like moving between rooms in a real home.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SUB_ROOMS.map((room) => (
              <div
                key={room.id}
                className="rounded-2xl border border-cozy-200 bg-white p-5 shadow-sm transition hover:border-plum-300 hover:shadow-md"
              >
                <h3 className="font-semibold text-cozy-900">{room.label}</h3>
                <p className="mt-2 text-sm text-cozy-600">{room.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Differentiator */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-plum-600">
            What makes it different
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold text-cozy-900">
            Built for friendship, not productivity
          </h2>
          <p className="mt-4 text-cozy-600 leading-relaxed">
            Unlike scheduling apps or large communication platforms, Hangout Hub focuses
            specifically on reducing social friction, encouraging spontaneous interaction, and
            making friendships easier to maintain digitally.
          </p>
          <blockquote className="mt-8 rounded-2xl border border-plum-200 bg-plum-50/50 px-6 py-5 font-display text-lg italic text-plum-900">
            &ldquo;Social connection should feel lightweight, comfortable, and accessible.&rdquo;
          </blockquote>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-plum-700 to-plum-600 px-6 py-16 text-white">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            Ready to hang out without the pressure?
          </h2>
          <p className="mt-3 opacity-90">
            Create your avatar, invite friends, and step into your first virtual room in
            minutes.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/sign-up" className="btn-primary bg-white text-plum-700 hover:bg-cozy-50">
              Get started free
            </Link>
            <Link
              to="/sign-in"
              className="rounded-xl border-2 border-white/60 px-5 py-2.5 font-medium transition hover:bg-white/10"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-cozy-200 bg-cozy-50 px-6 py-8 text-center text-sm text-cozy-500">
        Hangout Hub · Built for a hackathon on solving real personal pain points
      </footer>
    </div>
  );
}
