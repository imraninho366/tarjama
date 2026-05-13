# Tarjama — Project Instructions

## Overview
Tarjama is a Quran learning app in French — users translate verses, take quizzes, learn Arabic vocabulary, track prayer times, and explore Islamic content. Built with Next.js Pages Router, Supabase auth/database, and Groq LLM API.

## Tech Stack
| Layer | Technology | Version |
|-------|-----------|---------|
| Language | JavaScript (no TypeScript) | ES2022 |
| Framework | Next.js (Pages Router) | 14.2.3 |
| UI | React + CSS Modules | 18.x |
| Database | Supabase (PostgreSQL) | - |
| Auth | Supabase Auth (email/password) | - |
| AI | Groq API (llama-3.3-70b-versatile) | - |
| Hosting | Vercel | - |

## IMPORTANT: This is Pages Router
- Use `next/head` for metadata (NOT `export const metadata`)
- Use `next/router` for navigation (NOT `next/navigation`)
- Do NOT add `"use client"` — not needed in Pages Router
- API routes use `export default function handler(req, res)`
- Pages receive props from `_app.js` (user, profile, onLogout)

## Code Style
- No TypeScript — all `.js` files
- CSS Modules for styling (`styles/*.module.css`, `components/*.module.css`)
- CSS variables in `styles/globals.css` — use `var(--gold)` not `G.gold` in new code
- Theme: `[data-theme="light"]` override, light is default
- Arabic text: `fontFamily: 'var(--font-arabic)'`, `direction: 'rtl'`
- French UI text throughout

## Project Structure
```
pages/           → 24 pages
pages/api/       → 17 API routes (Groq, Supabase, external)
components/      → 9 shared components
lib/             → 9 utility modules
styles/          → CSS Modules + globals.css
public/          → Static JSON data files
```

## Supabase Tables
- `profiles` (id, username, color)
- `progress` (user_id, sourate_num, verse_num, niveau, feedback)
- `duels` (code, players, scores, mode)
- `premium_users` (id, granted_by)
- `keepalive` (id, pinged_at)

## API Route Pattern
```js
import { rateLimit } from '../../lib/rateLimit'
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { ok } = rateLimit(req, { limit: 10, windowMs: 60000 })
  if (!ok) return res.status(429).json({ error: 'Trop de requêtes.' })
  // ... logic
}
```

## External APIs
- Groq (api.groq.com) — AI responses
- Aladhan (api.aladhan.com) — Prayer times
- AlQuran (api.alquran.cloud) — Verse text
- GitHub Raw — Hadith data

## Admin
- Admin ID: `cc0683b4` (Imran)
- Hidden page: `/admin`
- Can grant/revoke premium, delete users

## Build & Run
- `npm run dev` — dev server
- `npm run build` — production build
- No linter or tests configured

## Conventions
- Commit: imperative English, `Co-Authored-By: Claude` footer
- Rate limit all external API routes
- Service worker caches all pages offline
- Freemium: quiz 10/day, translation unlimited, admin unlimited
