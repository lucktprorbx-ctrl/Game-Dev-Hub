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

function mockStats(gameId: number) {
  const seed = gameId * 137;
  const ccu = 150 + (seed % 800);
  const peakCcu = ccu + 200 + (seed % 300);
  const avgDailyRevenue = 1200 + (seed % 8000);
  const avgDailyRevenueEur = avgDailyRevenue * ROBUX_TO_EUR_RATE;
  const monthlyEstimateRobux = avgDailyRevenue * 30;
  const monthlyEstimateEur = monthlyEstimateRobux * ROBUX_TO_EUR_RATE;
  const revenuePercentChange = -15 + (seed % 40);

  const now = Date.now();
  const ccuHistory = Array.from({ length: 24 }, (_, i) => ({
    timestamp: new Date(now - (23 - i) * 3600 * 1000).toISOString(),
    value: Math.max(0, ccu + Math.floor(Math.sin(i) * 100) + (i * 3)),
  }));

  return {
    gameId,
    ccu,
    peakCcu,
    avgDailyRevenue,
    avgDailyRevenueEur,
    monthlyEstimateRobux,
    monthlyEstimateEur,
    revenuePercentChange,
    ccuHistory,
  };
}

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

  let totalCcu = 0;
  let totalDailyRevenue = 0;
  let totalDailyRevenueEur = 0;

  for (const game of activeGames) {
    const stats = mockStats(game.id);
    totalCcu += stats.ccu;
    totalDailyRevenue += stats.avgDailyRevenue;
    totalDailyRevenueEur += stats.avgDailyRevenueEur;
  }

  const topGame = activeGames.sort((a, b) => mockStats(b.id).ccu - mockStats(a.id).ccu)[0];

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

  const statsAll = activeGames.map(g => ({ game: g, stats: mockStats(g.id) }));
  const totalRevenue = statsAll.reduce((s, { stats }) => s + stats.monthlyEstimateRobux, 0);

  const result = statsAll.map(({ game, stats }) => ({
    gameId: game.id,
    gameName: game.name,
    revenuePercentage: totalRevenue > 0 ? (stats.monthlyEstimateRobux / totalRevenue) * 100 : 0,
    monthlyEstimateRobux: stats.monthlyEstimateRobux,
    monthlyEstimateEur: stats.monthlyEstimateEur,
    trend: stats.revenuePercentChange,
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
  res.json(mockStats(params.data.id));
});

export default router;
