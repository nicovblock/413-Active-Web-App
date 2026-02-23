# 413 Active Fitness Tracker

A collaborative, real-time fitness tracker for clients and coaches with role-specific interfaces.

## Chosen stack
**Option A**: React 19 + TypeScript + Vite (frontend), Express + Node.js + TypeScript (backend), SQLite via better-sqlite3, JWT auth, Socket.IO realtime, Tailwind CSS.

## Features
- Email/password registration + login with client/coach roles
- Separate coach and client interfaces
- Coach workout assignment with instant client updates (Socket.IO)
- Client dashboard with workout calendar, weight tracking, meal tracking (MyFitnessPal source tagging), and subscription management
- CSV export of fitness data
- Dark/light mode with persistence
- Mobile-responsive Apple-like UI and basic in-app notifications
- Offline dashboard viewing fallback (service worker + IndexedDB cache)

## Security & quality notes
- JWT-based auth with role checks
- Password hashing via bcrypt
- Input validation with zod and basic text sanitization
- Helmet, CORS, and request rate limiting enabled
- Loading and empty states across key screens

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
3. Run both apps:
   ```bash
   npm run dev
   ```
4. Open:
   - Client: http://localhost:5173
   - Server: http://localhost:4000

## Build
```bash
npm run build
```

## Typecheck
```bash
npm run typecheck
```

## Project structure
- `client/` React app
- `server/` Express API + Socket.IO + SQLite DB bootstrapping
