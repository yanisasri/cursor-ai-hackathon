# Hangout Hub — How to Start & Run

**Hangout Hub** is a hackathon demo for a low-pressure social platform: virtual hangout spaces, avatars, shared calendars, decision tools, and friend coordination (max 8 people per room).

## Prerequisites

- **Node.js** 18 or newer ([https://nodejs.org](https://nodejs.org))
- **npm** (included with Node.js)

Check versions:

```bash
node -v
npm -v
```


## Demo walkthrough

1. **Landing** (`/`) — Read the feature overview, then click **Create account**.
2. **Sign up** — Use any email and a password with at least 6 characters.
3. **Avatar setup** — Customize hairstyle, clothes, and colors, then continue.
4. **Home** — You’ll see demo friends (Alex, Sam, Jordan) on the right. Create a **new room** or open an existing one.
5. **Create room** — Pick area (house, office, café, park), name, max people (≤8), and friends.
6. **Virtual room** — Move with **WASD** or on-screen arrows. Walk into zones or use the top tabs:
   - **Living** — Voice chat toggle (demo)
   - **Calendar** — Share availability & demo hangout reminders
   - **Decision** — Polls, wheel spinner, tier list, swipe cards
   - **Suggestions** — Add restaurants/activities
   - **Personal** — Request to enter private space
7. **Account** (top right) — View email, edit avatar, sign out.
8. **Notifications** (bell icon) — Hangout, calendar, and voting alerts.

## Data & persistence

- All data is stored in the browser **localStorage** (no backend required for the demo).
- Clearing site data or using a private window resets accounts and rooms.
- Passwords are stored locally for demo only — **do not use real passwords** in production.

## Project structure

```
cursor-ai-hackathon/
├── GETTING_STARTED.md    ← This file
├── package.json
├── index.html
├── public/
└── src/
    ├── pages/            Landing, auth, home, room creation, virtual room
    ├── components/       Avatar, friends, chat, virtual world, decision tools
    ├── context/          App state & localStorage
    ├── lib/              Storage helpers
    └── types/            TypeScript types
```

## Troubleshooting

| Issue | Fix |
|--------|-----|
| `command not found: npm` | Install Node.js from nodejs.org |
| Port 5173 in use | Stop other Vite apps or run `npm run dev -- --port 3000` |
| Blank page after changes | Hard refresh (Cmd+Shift+R) or restart `npm run dev` |
| Old demo data | Clear localStorage for localhost in browser dev tools |

## Scripts reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Serve the production build locally |

## Tech stack

- React 18 + TypeScript
- Vite
- React Router
- Tailwind CSS
- localStorage for persistence
