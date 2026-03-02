# Ride Match

Community-based ride matching platform (Next.js + Supabase).

## Setup

1. Copy `.env.example` to `.env.local` and set your Supabase URL and anon key.
2. In Supabase Dashboard:
   - Enable **PostGIS** (Database → Extensions).
   - Enable **Google** under Authentication → Providers and configure OAuth.
   - Add redirect URL: `http://localhost:3000/auth/callback` (and your production URL) under Authentication → URL Configuration.
   - Run migrations in `supabase/migrations/` (Schema, RLS, Functions).
3. Add PWA icons to `public/`: `icon-192x192.png`, `icon-512x512.png` (or update `app/manifest.ts`).

## Run

- `npm run dev` — development
- `npm run build` && `npm start` — production

## Routes

- `/login` — Google OAuth
- `/community` — Join or create community
- `/` — Home (create trip / search)
- `/search` — Search trips
- `/trips/new` — Create trip
- `/trips/[id]` — Trip detail, book seat
- `/trips/[id]/chat` — Trip chat
- `/trips/[id]/rate` — Rate after trip
- `/profile` — Profile
- `/admin/analytics` — Admin funnel and daily metrics (admin only)
