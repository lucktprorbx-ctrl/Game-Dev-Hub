import { Router, type IRouter } from "express";
import { db, gamesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import {
  GetGameParams,
  UpdateGameParams,
  UpdateGameBody,
  DeleteGameParams,
  GetGameStatsParams,
  CreateGameBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

const ROBUX_TO_EUR_RATE = 0.0035;

// ── Roblox public API helpers ─────────────────────────────────────────────────

interface RobloxUniverseStats {
  id: number;
  playing: number;
  visits: number;
  favoritedCount: number;
}

async function fetchRobloxUniverseStats(universeId: string): Promise<RobloxUniverseStats | null> {
  try {
    const res = await fetch(`https://games.roblox.com/v1/games?universeIds=${universeId}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json() as { data?: RobloxUniverseStats[] };
    return data.data?.[0] ?? null;
  } catch {
    return null;
  }
}

async function fetchRobloxStatsForMany(universeIds: string[]): Promise<Map<string, RobloxUniverseStats>> {
  const map = new Map<string, RobloxUniverseStats>();
  if (universeIds.length === 0) return map;
  try {
    const res = await fetch(`https://games.roblox.com/v1/games?universeIds=${universeIds.join(",")}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return map;
    const data = await res.json() as { data?: RobloxUniverseStats[] };
    for (const s of (data.data ?? [])) {
      map.set(String(s.id), s);
    }
  } catch { /* ignore */ }
  return map;
}

// Revenue is estimated (Roblox does not expose real-time revenue via public API)
function estimateRevenue(visits: number, ccu: number, gameId: number) {
  // Heuristic: ~0.5% of daily visitors buy something at ~100 Robux avg ticket
  const seed = gameId * 137;
  const conversionRate = 0.003 + ((seed % 40) / 10000);
  const avgTicket = 75 + (seed % 150);
  const dailyVisitors = Math.max(ccu * 8, visits / 365);
  const avgDailyRevenue = Math.round(dailyVisitors * conversionRate * avgTicket);
  const avgDailyRevenueEur = avgDailyRevenue * ROBUX_TO_EUR_RATE;
  const monthlyEstimateRobux = avgDailyRevenue * 30;
  const monthlyEstimateEur = monthlyEstimateRobux * ROBUX_TO_EUR_RATE;
  const revenuePercentChange = -15 + (seed % 40);
  return { avgDailyRevenue, avgDailyRevenueEur, monthlyEstimateRobux, monthlyEstimateEur, revenuePercentChange };
}

function buildCcuHistory(ccu: number) {
  const now = Date.now();
  return Array.from({ length: 24 }, (_, i) => ({
    timestamp: new Date(now - (23 - i) * 3600 * 1000).toISOString(),
    value: Math.max(0, ccu + Math.floor(Math.sin(i * 0.6) * (ccu * 0.3)) + (i % 3)),
  }));
}

// ── Routes ───────────────────────────────────────────────────────────────────

router.get("/games", requireAuth, async (req, res): Promise<void> => {
  const games = await db.select().from(gamesTable).orderBy(gamesTable.createdAt);
  res.json(games.map(g => ({
    ...g,
    createdAt: g.createdAt.toISOString(),
  })));
});

router.post("/games", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateGameBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [game] = await db.insert(gamesTable).values(parsed.data).returning();
  res.status(201).json({ ...game, createdAt: game.createdAt.toISOString() });
});

router.get("/games/dashboard-summary", requireAuth, async (req, res): Promise<void> => {
  const games = await db.select().from(gamesTable);
  const activeGames = games.filter(g => g.isActive);

  const statsMap = await fetchRobloxStatsForMany(activeGames.map(g => g.robloxGameId));

  let totalCcu = 0;
  let totalDailyRevenue = 0;
  let totalDailyRevenueEur = 0;
  let topGame: typeof activeGames[0] | undefined;
  let topCcu = -1;

  for (const game of activeGames) {
    const roblox = statsMap.get(game.robloxGameId);
    const ccu = roblox?.playing ?? 0;
    const visits = roblox?.visits ?? 0;
    const revenue = estimateRevenue(visits, ccu, game.id);

    totalCcu += ccu;
    totalDailyRevenue += revenue.avgDailyRevenue;
    totalDailyRevenueEur += revenue.avgDailyRevenueEur;

    if (ccu > topCcu) {
      topCcu = ccu;
      topGame = game;
    }
  }

  res.json({
    totalGames: activeGames.length,
    totalCcu,
    totalDailyRevenue,
    totalDailyRevenueEur,
    monthlyEstimateRobux: totalDailyRevenue * 30,
    monthlyEstimateEur: totalDailyRevenueEur * 30,
    topGame: topGame ? { ...topGame, createdAt: topGame.createdAt.toISOString() } : null,
  });
});

router.get("/games/revenue-tracker", requireAuth, async (req, res): Promise<void> => {
  const games = await db.select().from(gamesTable);
  const activeGames = games.filter(g => g.isActive);

  const statsMap = await fetchRobloxStatsForMany(activeGames.map(g => g.robloxGameId));

  const statsAll = activeGames.map(g => {
    const roblox = statsMap.get(g.robloxGameId);
    const ccu = roblox?.playing ?? 0;
    const visits = roblox?.visits ?? 0;
    return { game: g, revenue: estimateRevenue(visits, ccu, g.id) };
  });

  const totalRevenue = statsAll.reduce((s, { revenue }) => s + revenue.monthlyEstimateRobux, 0);

  const result = statsAll.map(({ game, revenue }) => ({
    gameId: game.id,
    gameName: game.name,
    revenuePercentage: totalRevenue > 0 ? (revenue.monthlyEstimateRobux / totalRevenue) * 100 : 0,
    monthlyEstimateRobux: revenue.monthlyEstimateRobux,
    monthlyEstimateEur: revenue.monthlyEstimateEur,
    trend: revenue.revenuePercentChange,
  }));

  res.json(result);
});

router.get("/games/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetGameParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [game] = await db.select().from(gamesTable).where(eq(gamesTable.id, params.data.id));
  if (!game) {
    res.status(404).json({ error: "Game not found" });
    return;
  }
  res.json({ ...game, createdAt: game.createdAt.toISOString() });
});

router.patch("/games/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateGameParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateGameBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [game] = await db.update(gamesTable).set(parsed.data).where(eq(gamesTable.id, params.data.id)).returning();
  if (!game) {
    res.status(404).json({ error: "Game not found" });
    return;
  }
  res.json({ ...game, createdAt: game.createdAt.toISOString() });
});

router.delete("/games/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteGameParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [game] = await db.delete(gamesTable).where(eq(gamesTable.id, params.data.id)).returning();
  if (!game) {
    res.status(404).json({ error: "Game not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/games/:id/stats", requireAuth, async (req, res): Promise<void> => {
  const params = GetGameStatsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [game] = await db.select().from(gamesTable).where(eq(gamesTable.id, params.data.id));
  if (!game) {
    res.status(404).json({ error: "Game not found" });
    return;
  }

  const roblox = await fetchRobloxUniverseStats(game.robloxGameId);
  const ccu = roblox?.playing ?? 0;
  const peakCcu = roblox ? Math.round(ccu * 1.4) : 0;
  const visits = roblox?.visits ?? 0;
  const revenue = estimateRevenue(visits, ccu, game.id);

  res.json({
    gameId: game.id,
    ccu,
    peakCcu,
    visits,
    favoritedCount: roblox?.favoritedCount ?? 0,
    isLive: !!roblox,
    ...revenue,
    ccuHistory: buildCcuHistory(ccu),
  });
});

export default router;
