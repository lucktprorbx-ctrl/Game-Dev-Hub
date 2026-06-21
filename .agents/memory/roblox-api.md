---
name: Roblox public API for game stats
description: What's available without an API key vs what requires Open Cloud
---

## Public (no key)
- CCU + visits + favorites: `GET https://games.roblox.com/v1/games?universeIds={id1},{id2},...`
  - Returns: `id`, `playing` (current players = CCU), `visits`, `favoritedCount`
  - Used in `artifacts/api-server/src/routes/games.ts` via `fetchRobloxUniverseStats`/`fetchRobloxStatsForMany`
  - Rate limit: be reasonable, batching multiple IDs in one call is fine

## Revenue
- **No public real-time revenue API exists**
- Revenue is estimated from visits + CCU using a deterministic heuristic in `estimateRevenue()` in `games.ts`
- Open Cloud API key (`ROBLOX_API_KEY`) needed for actual revenue data — not yet integrated
- The heuristic: ~0.3% conversion × avg ticket × daily visitors

**Why:** Roblox doesn't expose real-time revenue via any public or Open Cloud API at this time (as of mid-2026).
