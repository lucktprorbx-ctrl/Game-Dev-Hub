# RoVerse Dashboard

Studio Operations Hub pour la gestion des jeux Roblox de RoVerseFR — stats en temps réel, planning collaboratif, et gestion des équipes.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/dashboard run dev` — run the frontend dashboard
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `ROBLOX_CLIENT_ID`, `ROBLOX_CLIENT_SECRET`, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite + Tailwind CSS v4 + shadcn/ui + framer-motion
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: Roblox OAuth 2.0 (cookie-based sessions)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- i18n: react-i18next (English + French)
- Planning: @hello-pangea/dnd (Kanban) + custom calendar

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/db/src/schema/` — DB schema: users.ts, games.ts, planning.ts
- `artifacts/api-server/src/routes/` — API routes: auth, games, users, planning
- `artifacts/api-server/src/middlewares/requireAuth.ts` — Auth middleware
- `artifacts/dashboard/src/` — React frontend
- `artifacts/dashboard/src/i18n.ts` — i18n config (EN/FR)

## Architecture decisions

- **Roblox OAuth 2.0** — Sessions stored in PostgreSQL, cookie-based (`session_id`), 7-day expiry
- **Role hardcoding** — Admin/Collaborator roles are determined by Roblox ID at login (IDs: 454458772, 1428066981, 2001745284 = Admin; 3080402841, 9690401925 = Collaborator). DB role is updated on each login.
- **Game stats are mocked** — Roblox does not provide public real-time CCU/revenue APIs. Stats use deterministic mock data seeded by game ID. Replace with real Roblox Open Cloud API when available.
- **Dark-only theme** — The UI is forced dark via next-themes. No light mode toggle.
- **GDPR banner** — Cookie consent stored in localStorage, shown on first visit.

## Product

- **Dashboard** — Aggregated CCU, daily revenue (Robux + EUR), monthly estimates across all games
- **Games** — Link/manage Roblox games, view per-game stats and CCU history charts
- **Revenue Tracker** — Revenue % split table with monthly estimates and trend indicators
- **Planning** — Trello-style Kanban boards + calendar/agenda for team coordination
- **Users** — Admin panel: manage users, roles (Admin/Collaborator), subroles, and groups
- **Auth** — Roblox OAuth 2.0 login with role-based access control

## User preferences

- Thème entièrement sombre (noir, near-blacks, accent amber)
- Site en anglais par défaut avec toggle EN/FR
- Conforme RGPD (bannière cookies)
- Facilement déployable sur Vercel et en local

## Gotchas

- OAuth callback URI must be whitelisted in the Roblox OAuth app: `https://[domain]/api/auth/roblox/callback`
- For local dev: add `http://localhost:5000/api/auth/roblox/callback` to allowed redirect URIs in Roblox dashboard
- Game stats are mocked (Roblox doesn't offer public real-time APIs) — deterministic mock based on game ID
- Robux→EUR conversion rate hardcoded at 0.0035 (adjust in `artifacts/api-server/src/routes/games.ts`)
- `SESSION_SECRET` env var is optional in dev (falls back to `dev-secret-change-me`) but required in production

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- Roblox OAuth docs: https://create.roblox.com/docs/cloud/oauth2
