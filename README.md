# Hangout Hub

A low-pressure virtual social hub for the Cursor AI Hackathon (2026) — hang out online without needing a reason.

**Hangout Hub** is a low-pressure social platform: customizable avatars, virtual hangout spaces, shared calendars, decision tools, and friend coordination (max 8 people per room).

**Live app:** [hangout-hub.vercel.app](http://hangout-hub.vercel.app)

## Features

### Accounts & social
- Sign up / sign in with email and password
- **Lorelei portrait avatars** (DiceBear) — hair, eyes, expression, brows, glasses, earrings, freckles; skin & hair color pickers
- Friend requests — send by email, accept or decline incoming requests
- Room invites — invite friends to a room; accept or decline from home
- **Presence status** — online, idle (after 5 min inactivity), or offline; set manually from the navbar or updated automatically
- Account settings — edit avatar, manage friends, delete account

### Virtual rooms
- Bird's-eye virtual world with **WASD**, click-to-move, and on-screen controls
- **Live avatar sync** — see friends move around the room in real time (Supabase Realtime broadcast)
- Sub-rooms: living, calendar, decision-making, suggestions, personal
- **WebRTC voice chat** in the living room (all members) and personal rooms (owner + one guest inside)
- Message chat with **room nicknames** (per-room display names)
- Room settings — invite members, propose room name changes with member approval
- Leave room; rooms auto-delete when only one member remains

### Personal rooms
Each member has a private room on the map (max **2 people** inside: owner + one guest).

- **Auto-enter your room** — walk into your personal zone and you're in; no extra button needed
- **Ring doorbell** — request access when a friend is home (online/idle)
- **Leave a note** — when a friend is away (offline), compose a mailbox note with custom paper, envelope color, and stickers (≤100 words)
- **Mailbox inbox** — owners see notes in their personal room; unread notes play a doorbell sound
- **Access flow** — owner approves/denies requests; approved guests enter when the room is free; wait-your-turn if someone else is inside
- Hover a friend's personal room on the map for a quick visit panel (doorbell, enter, or mailbox)

### Home & coordination
- Room cards on home show member avatars with **presence-colored rings** (green = online, amber = idle, grey = offline)
- Shared availability calendar — connect Google/Apple (demo), add hangout requests, RSVP, color-coded events by member, tap days/events for details
- Decision tools — polls, wheel spinner, tier list, dating app-style swipe cards
- Suggestions — add ideas with categories, likes, and weekly rankings
- Notifications for hangouts, calendar, decisions, friends, and room invites

### Landing page
- Feature overview, pain points, and an **interactive app preview** mock of the virtual room UI

## Walkthrough

1. **Landing** (`/`) — Read the overview and app preview, then click **Create account**.
2. **Sign up** — Use any email and a password with at least 6 characters.
3. **Avatar setup** — Customize your portrait avatar, then continue.
4. **Home** — Your rooms appear on the left; friends and pending invites on the right. Room cards show who's in each room and their online status.
5. **Create room** — Enter a room name, max people (≤8), and invite friends.
6. **Virtual room** — Move with **WASD** or click the floor. Walk into zones or use the top tabs:
   - **Living** — Join voice chat; see other avatars move in real time
   - **Calendar** — Shared events, hangout requests, RSVP, color-coded by member
   - **Decision** — Polls, wheel spinner, tier list, swipe cards
   - **Suggestions** — Add and rank ideas
   - **Personal** — Walk to your room (auto-enter) or a friend's room — ring doorbell, enter if approved, or leave a mailbox note if they're away
   - **Settings** — Room nicknames, invites, and name-change approvals
7. **Account** (top right) — View email, edit avatar, manage friends, sign out, or delete account.
8. **Notifications** (bell icon) — Friend requests, room invites, hangouts, calendar, and voting alerts.

## Tech stack

### Frontend

| Layer | Technology |
|-------|------------|
| UI | React 18 + TypeScript |
| Build | Vite |
| Routing | React Router v6 |
| Styling | Tailwind CSS + PostCSS + Autoprefixer |
| Avatars | [DiceBear](https://www.dicebear.com/) — `@dicebear/core` + `@dicebear/collection` (Lorelei style) |
| Voice | WebRTC peer connections via Supabase Realtime signaling |

### Backend

| Layer | Technology |
|-------|------------|
| Database & auth | [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security) |
| API | Supabase client SDK |
| Realtime | Supabase channels — avatar position broadcast, voice signaling, presence |

### Virtual room design

Each room is a top-down “house” map with a central hallway and clickable zones:

| Zone | Purpose |
|------|---------|
| Living / meeting | Open voice chat for all members |
| Calendar | Shared availability and hangout planning |
| Decision room | Polls, spinner, tier list, swipe cards |
| Ideas | Suggestions and weekly rankings |
| Personal rooms | One per member — doorbell, mailbox, and 1:1 voice |

Avatars spawn in the hallway and walk into zones. Other members' positions sync over Realtime while you're in the room.


## Project structure

```
cursor-ai-hackathon/
├── README.md
├── package.json
├── supabase/              SQL migrations for Supabase
├── public/
└── src/
    ├── pages/             Landing, auth, avatar setup, home, room creation, virtual room, account
    ├── components/        Avatar editor, friends sidebar, chat, virtual world, decision tools, voice
    │   ├── mailbox/       Note composer, inbox, send animation, external mailbox UI
    │   └── decision/      Polls, wheel, tier list, swipe cards
    ├── context/           App state (auth, rooms, friends, notifications, mailbox)
    ├── hooks/             WASD movement, voice chat, live avatar presence
    ├── lib/               Supabase API, storage, DiceBear avatars, voice channels, doorbell sound
    └── types/             TypeScript types and presence helpers
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
