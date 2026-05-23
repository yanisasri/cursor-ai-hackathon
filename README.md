# Hangout Hub

A low-pressure virtual social hub for the Cursor AI Hackathon — hang out online without needing a reason.

**Hangout Hub** is a low-pressure social platform: virtual hangout spaces, avatars, shared calendars, decision tools, and friend coordination (with a max of 8 people per room).

## Features

- Sign up / sign in with avatar customization
- Virtual rooms with bird's-eye movement (WASD controls)
- Sub-rooms: living, calendar, decision-making, suggestions, personal (request to enter)
- Friends list with online status (max 8 members per room)
- Shared availability calendar
- Decision tools: polls, wheel spinner, tier list, dating app-style swipe
- Message chat, voice toggle (demo), notifications


## Walkthrough

1. **Landing** (`/`) — Read the feature overview, then click **Create account**.
2. **Sign up** — Use any email and a password with at least 6 characters.
3. **Avatar setup** — Customize hairstyle, facial features, and colors, then continue.
4. **Home** — You’ll see your friends on the right. Create a **new room** or open an existing one.
5. **Create room** — Add a room name and invite your friends (max 7 friends).
6. **Virtual room** — Move with **WASD** or on-screen arrows. Walk into zones or use the top tabs:
   - **Living** — Voice chat toggle
   - **Calendar** — Share availability, hangout reminders, and event creations
   - **Decision** — Polls, wheel spinner, tier list, swipe cards
   - **Suggestions** — Add restaurants/activities, like ideas, weekly rankings
   - **Personal** — Request to enter private space (1:1 voice chats)
7. **Account** (top right) — View email, edit avatar, sign out.
8. **Notifications** (bell icon) — Hangout, calendar, and voting alerts.


## Project structure

```
cursor-ai-hackathon/
├── README.md    ← This file
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


## Tech stack

- React 18 + TypeScript
- Vite
- React Router
- Tailwind CSS