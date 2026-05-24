# Hangout Hub

A low-pressure virtual social hub for the Cursor AI Hackathon — hang out online without needing a reason.

**Hangout Hub** is a low-pressure social platform: customizable avatars, virtual hangout spaces, shared calendars, decision tools, and friend coordination (max 8 people per room).

<!-- need to edit -->
Deployed link [http://localhost:5173](http://localhost:5173). 


## Features

- Sign up / sign in with avatar customization
- **Lorelei portrait avatars** (DiceBear) — hair, eyes, expression, brows, glasses, earrings, freckles; skin & hair color pickers
- Virtual rooms with bird's-eye movement (WASD + click-to-move)
- Sub-rooms: living, calendar, decision-making, suggestions, personal (request to enter)
- Friends list with online status
- Shared availability calendar
- Decision tools: polls, wheel spinner, tier list, dating app-style swipe
- Suggestions with likes and weekly rankings
- Message chat, voice toggle, notifications

## Walkthrough

1. **Landing** (`/`) — Read the feature overview, then click **Create account**.
2. **Sign up** — Use any email and a password with at least 6 characters.
3. **Avatar setup** — Pick hair, eyes, expression, brows, and accessories; choose skin and hair color, then continue.
4. **Home** — Friends appear on the right. Create a **new room** or open an existing one.
5. **Create room** — Enter a room name, max people (≤8), and invite friends.
6. **Virtual room** — Move with **WASD**, click the floor, or use on-screen arrows. Walk into zones or use the top tabs:
   - **Living** — Voice chat toggle
   - **Calendar** — Share availability, hangout reminders, and events
   - **Decision** — Polls, wheel spinner, tier list, swipe cards
   - **Suggestions** — Add restaurants/activities, like ideas, weekly rankings
   - **Personal** — Request to enter a private space (1:1 voice demo)
7. **Account** (top right) — View email, edit avatar, sign out.
8. **Notifications** (bell icon) — Hangout, calendar, and voting alerts.

## Tech stack

### Frontend

| Layer | Technology |
|-------|------------|
| UI | React 18 + TypeScript |
| Build | Vite |
| Routing | React Router v6 |
| Styling | Tailwind CSS + PostCSS + Autoprefixer |
| Avatars | [DiceBear](https://www.dicebear.com/) — `@dicebear/core` + `@dicebear/collection` (Lorelei style) |


### Backend 

| Layer | Technology |
|-------|------------|
| Database & auth | [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security, realtime) |
| API | Supabase client SDK  |



### Room design

<!-- add to this -->


### Supabase backend

Supabase will likely cover:

- **Auth** — email/password (or magic link) instead of demo-only local passwords
- **Tables** — users, avatars, friends, virtual rooms, messages, calendar events, polls, suggestions, notifications
- **Realtime** — live room presence, chat, and notification updates
- **Storage** (optional) — suggestion images or room assets

Environment variables (typical setup):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Until Supabase is connected, all data resets if you clear site data or use a private window. **Do not use real passwords** in the current localStorage demo.


## Project structure

```
cursor-ai-hackathon/
├── README.md
├── package.json
├── index.html
├── public/
└── src/
    ├── pages/            Landing, auth, avatar setup, home, room creation, virtual room
    ├── components/       Avatar editor/preview, friends, chat, virtual world, decision tools
    ├── context/          App state (will bridge to Supabase)
    ├── lib/              Storage helpers, DiceBear avatar generation
    ├── hooks/            Keyboard helpers (WASD)
    └── types/            TypeScript types
```


## Avatar customization

Avatars use the **Lorelei** trendy portrait style.

| Customizable | Options |
|--------------|---------|
| Hair | 48 styles |
| Eyes | 24 styles (fixed black) |
| Mouth | 18 expressions (fixed black lips) |
| Brows | 13 styles |
| Glasses | None or 5 styles |
| Earrings | None or 3 styles |
| Freckles | On / off |
| Skin tone | Swatch picker |
| Hair color | Swatch picker |

Edit anytime from **Account → Edit avatar**.
