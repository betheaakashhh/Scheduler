# ⚡ TimeFlow — Smart Timetable Manager

A full-stack, real-time timetable and daily task tracker built with Next.js 14, Supabase, Prisma, Socket.io, Redis/BullMQ, and Tailwind CSS.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🕐 Live Slot Tracker | Slots auto-detect Active / Done / Upcoming / Missed in real time |
| 🔒 Strict Mode | Meal slots require food log; strict academic slots block progress |
| 🍽️ Food Logger | Log every meal item; required before marking meal slots complete |
| ✅ Checklists | Per-slot checklists with per-day state (alarm reminders, habit checks) |
| 📧 Email Reminders | BullMQ-scheduled emails 15 min before any email-enabled slot |
| 🔥 Streak System | Daily streak with warning email when about to break |
| ⚡ XP + Levels | 6-level progression (Starter → Legend) with XP per completion |
| 📅 Academic Timetable | Upload PDF/image/text → parse periods → show live "now / next" during college hours |
| 🌙 Dark Mode | Full dark theme via CSS custom properties |
| 📱 PWA | Installable mobile app with offline-friendly shell |
| 🔄 Real-time | Socket.io broadcasts slot ticks, XP gains, streak updates |

---

## 🏗️ Tech Stack

```
Frontend:   Next.js 14 (App Router) · TypeScript · Tailwind CSS · Zustand
Backend:    Next.js API Routes · NextAuth (JWT) · Prisma ORM
Database:   Supabase (PostgreSQL)
Real-time:  Socket.io (standalone Node server)
Queue:      BullMQ + Redis (email jobs, auto-complete jobs, streak checks)
Email:      Nodemailer (Gmail SMTP / any SMTP)
Parser:     pdf-parse + Tesseract.js (academic timetable OCR)
```

---

## 🚀 Quick Start

### 1. Clone & install

```bash
git clone <your-repo>
cd timeflow
npm install
```

### 2. Set up environment

```bash
cp .env.example .env
# Fill in all values — see comments in .env.example
```

**Minimum required:**
- `DATABASE_URL` + `DIRECT_URL` — from Supabase project settings
- `NEXTAUTH_SECRET` — any random 32+ char string
- `REDIS_URL` — local Redis or Upstash URL
- `SMTP_*` — Gmail App Password or any SMTP provider

### 3. Set up database

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations (creates all tables)
npm run prisma:migrate

# Seed demo data (creates user: aathiya@demo.com / aathiya123)
npm run prisma:seed
```

### 4. Run development

```bash
# Terminal 1 — Next.js app
npm run dev

# Terminal 2 — Socket.io + BullMQ workers
npm run server

# OR run both together
npm run dev:all
```

Open [http://localhost:3000](http://localhost:3000)

Demo login: `aathiya@demo.com` / `aathiya123`

---

## 📁 Project Structure

```
timeflow/
├── prisma/
│   ├── schema.prisma          # Full DB schema
│   └── seed.ts                # Demo data seed
├── server.ts                  # Socket.io server + BullMQ workers
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/         # Login page
│   │   │   └── register/      # Register page
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx     # Shell + bottom nav + socket listeners
│   │   │   ├── today/         # Main live view
│   │   │   ├── schedule/      # Full schedule manager
│   │   │   ├── stats/         # XP, streak, weekly chart
│   │   │   └── settings/      # Profile, dark mode, timetable import
│   │   ├── api/
│   │   │   ├── auth/          # NextAuth + register
│   │   │   ├── schedules/     # CRUD schedules
│   │   │   ├── slots/         # CRUD slots + complete
│   │   │   ├── food-log/      # Save food items
│   │   │   ├── checklist/     # Toggle checklist items
│   │   │   ├── streak/        # Get/update streak
│   │   │   ├── stats/         # Weekly stats
│   │   │   └── timetable/     # Upload + parse academic timetable
│   │   ├── globals.css        # CSS variables (light/dark themes)
│   │   ├── layout.tsx         # Root layout
│   │   └── providers.tsx      # SessionProvider + theme
│   ├── components/
│   │   ├── slots/
│   │   │   ├── SlotCard.tsx         # Main interactive slot card
│   │   │   ├── ActiveNowBanner.tsx  # Live active slot banner
│   │   │   └── AcademicNowBanner.tsx # Current/next period display
│   │   ├── stats/
│   │   │   └── DayProgressBar.tsx
│   │   ├── modals/
│   │   │   └── AddSlotModal.tsx     # Bottom sheet slot creation
│   │   └── layout/
│   │       └── WelcomeBanner.tsx
│   ├── hooks/
│   │   └── useSocket.ts       # Socket.io client hook (singleton)
│   ├── lib/
│   │   ├── db/prisma.ts       # Prisma singleton
│   │   ├── redis/index.ts     # Redis client + BullMQ queues
│   │   ├── email/index.ts     # Nodemailer sender
│   │   ├── streak/index.ts    # Streak logic + warnings
│   │   ├── parser/            # PDF/image/text academic parser
│   │   └── slot/slotUtils.ts  # Status helpers, time utils
│   ├── store/
│   │   └── timetableStore.ts  # Zustand store (persisted)
│   └── types/index.ts         # All TypeScript types + TAG_CONFIG
└── public/
    └── manifest.json          # PWA manifest
```

---

## 🗄️ Database Schema Overview

```
User ──< Schedule ──< Slot ──< ChecklistItem
                         └──< SlotCompletion ──< FoodItem
                                              └──< ChecklistCheck
User ──  Streak
User ──< XPLog
User ──< AcademicTimetable
```

---

## 🔌 Socket.io Events

| Event | Direction | Payload |
|---|---|---|
| `join:room` | Client → Server | `userId` |
| `slot:complete` | Client → Server | `{ slotId, date, userId }` |
| `slot:tick` | Server → Client | `{ slotId, status }` |
| `slot:completed` | Server → Client | `{ slotId, date, xp }` |
| `xp:gained` | Server → Client | `{ points, total, levelUp? }` |
| `streak:updated` | Server → Client | `{ streak }` |
| `streak:warning` | Server → Client | `{ hoursLeft }` |
| `academic:period` | Server → Client | `{ current, next }` |

---

## 📧 Email Flow

1. Slot created with `emailReminder: true`
2. API calculates `msUntilSlotStart - 15min` delay
3. Job added to `email-notifications` BullMQ queue with delay
4. Worker fires Nodemailer when job executes
5. Streak warning email queued nightly at 8 PM if streak > 3 and no completions that day

---

## 📱 Academic Timetable Import

**Supported formats:** PDF · PNG/JPG (OCR) · Plain text · CSV

**Text format example:**
```
Monday
9:30 - 10:20  Compiler Design  Prof. Raj  Room 101
10:20 - 11:10  Principle of Management  Dr. Priya
11:10 - 12:00  Data Structures  Prof. Kumar  Lab 3

Tuesday
9:30 - 10:20  Operating Systems
...
```

---

## 🎮 XP & Level System

| Level | Label | XP Required |
|---|---|---|
| 1 | Starter | 0 |
| 2 | Rising | 100 |
| 3 | Consistent | 300 |
| 4 | Focused | 600 |
| 5 | Champion | 1,000 |
| 6 | Legend | 1,500 |

**XP per slot:** Wake Up +10, Meal +20, Walk +15, Gym +35, Self Study +40, Work +45, College +50

---

## 🔥 Streak Rules

- ✅ Complete any slot today → streak increments
- ❌ Miss an entire day → streak resets to 1
- 📧 Email warning sent at 8 PM if streak ≥ 3 and nothing completed yet
- 🏆 Longest streak stored separately (never decreases)

---

## 🚢 Deployment

### Vercel (Next.js)
```bash
vercel deploy
# Set all env vars in Vercel dashboard
```

### Socket.io Server (Railway / Render / VPS)
```bash
# On your server:
npm install
ts-node server.ts
# Set NEXT_PUBLIC_SOCKET_URL to your server URL
```

### Redis
- **Local:** `brew install redis && redis-server`
- **Production:** [Upstash](https://upstash.com) (free tier available)

### Database
- **Supabase:** Free tier at [supabase.com](https://supabase.com)

---

## 🤝 Contributing

PRs welcome! Please open an issue first for major changes.

---

*Built with ❤️ for Aathiya and anyone who wants to own their day.*
