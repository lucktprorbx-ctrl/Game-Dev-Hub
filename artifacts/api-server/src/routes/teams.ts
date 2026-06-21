import { Router, type IRouter } from "express";
import { db, teamsTable, teamMembersTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

function requireAdmin(req: Parameters<typeof requireAuth>[0], res: Parameters<typeof requireAuth>[1], next: Parameters<typeof requireAuth>[2]) {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}

function parseIntParam(val: unknown): number | null {
  const n = Number(val);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function serializeTeam(t: typeof teamsTable.$inferSelect) {
  return { ...t, createdAt: t.createdAt.toISOString() };
}

// ── List teams (all users see teams, but only admins can manage them) ──────────
router.get("/planning/teams", requireAuth, async (_req, res): Promise<void> => {
  const teams = await db.select().from(teamsTable).orderBy(teamsTable.createdAt);

  const memberships = await db
    .select({
      teamId: teamMembersTable.teamId,
      userId: teamMembersTable.userId,
      username: usersTable.robloxUsername,
      displayName: usersTable.robloxDisplayName,
      avatarUrl: usersTable.robloxAvatarUrl,
      role: usersTable.role,
    })
    .from(teamMembersTable)
    .innerJoin(usersTable, eq(teamMembersTable.userId, usersTable.id));

  const membersByTeam = new Map<number, typeof memberships>();
  for (const m of memberships) {
    if (!membersByTeam.has(m.teamId)) membersByTeam.set(m.teamId, []);
    membersByTeam.get(m.teamId)!.push(m);
  }

  res.json(teams.map(t => ({
    ...serializeTeam(t),
    members: (membersByTeam.get(t.id) ?? []).map(m => ({
      userId: m.userId,
      username: m.username,
      displayName: m.displayName,
      avatarUrl: m.avatarUrl,
      role: m.role,
    })),
  })));
});

// ── Create team (admin only) ───────────────────────────────────────────────────
router.post("/planning/teams", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const { name, description, color } = req.body as { name?: unknown; description?: unknown; color?: unknown };
  if (typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  const [team] = await db.insert(teamsTable).values({
    name: name.trim(),
    description: typeof description === "string" ? description.trim() : undefined,
    color: typeof color === "string" && color.trim() ? color.trim() : "#f59e0b",
  }).returning();
  res.status(201).json({ ...serializeTeam(team), members: [] });
});

// ── Update team (admin only) ───────────────────────────────────────────────────
router.patch("/planning/teams/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = parseIntParam(req.params["id"]);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  const { name, description, color } = req.body as { name?: unknown; description?: unknown; color?: unknown };
  const update: Record<string, unknown> = {};
  if (typeof name === "string" && name.trim()) update.name = name.trim();
  if (typeof description === "string") update.description = description.trim() || null;
  if (typeof color === "string" && color.trim()) update.color = color.trim();

  if (Object.keys(update).length === 0) { res.status(400).json({ error: "Nothing to update" }); return; }

  const [team] = await db.update(teamsTable).set(update as any).where(eq(teamsTable.id, id)).returning();
  if (!team) { res.status(404).json({ error: "Team not found" }); return; }
  res.json(serializeTeam(team));
});

// ── Delete team (admin only) ───────────────────────────────────────────────────
router.delete("/planning/teams/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = parseIntParam(req.params["id"]);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  const [team] = await db.delete(teamsTable).where(eq(teamsTable.id, id)).returning();
  if (!team) { res.status(404).json({ error: "Team not found" }); return; }
  res.sendStatus(204);
});

// ── Add member to team (admin only) ───────────────────────────────────────────
router.post("/planning/teams/:id/members", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const teamId = parseIntParam(req.params["id"]);
  if (!teamId) { res.status(400).json({ error: "Invalid team id" }); return; }

  const { userId } = req.body as { userId?: unknown };
  const uid = parseIntParam(userId);
  if (!uid) { res.status(400).json({ error: "userId is required" }); return; }

  const [team] = await db.select().from(teamsTable).where(eq(teamsTable.id, teamId));
  if (!team) { res.status(404).json({ error: "Team not found" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, uid));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  try {
    await db.insert(teamMembersTable).values({ teamId, userId: uid });
  } catch {
    // already a member — ignore unique constraint violation
  }

  res.status(201).json({
    userId: user.id,
    username: user.robloxUsername,
    displayName: user.robloxDisplayName,
    avatarUrl: user.robloxAvatarUrl,
    role: user.role,
  });
});

// ── Remove member from team (admin only) ──────────────────────────────────────
router.delete("/planning/teams/:id/members/:userId", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const teamId = parseIntParam(req.params["id"]);
  const userId = parseIntParam(req.params["userId"]);
  if (!teamId || !userId) { res.status(400).json({ error: "Invalid params" }); return; }

  await db.delete(teamMembersTable).where(
    and(eq(teamMembersTable.teamId, teamId), eq(teamMembersTable.userId, userId))
  );
  res.sendStatus(204);
});

// ── Get user's team memberships ───────────────────────────────────────────────
router.get("/planning/my-teams", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.id;
  const memberships = await db
    .select({ teamId: teamMembersTable.teamId })
    .from(teamMembersTable)
    .where(eq(teamMembersTable.userId, userId));
  res.json(memberships.map(m => m.teamId));
});

export default router;
