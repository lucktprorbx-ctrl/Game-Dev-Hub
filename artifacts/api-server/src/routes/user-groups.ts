import { Router, type IRouter } from "express";
import { db, userGroupsTable, userGroupMembersTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

function parseIntParam(val: unknown): number | null {
  const n = Number(val);
  return Number.isInteger(n) && n > 0 ? n : null;
}

async function serializeGroup(g: typeof userGroupsTable.$inferSelect) {
  const memberRows = await db
    .select({ userId: userGroupMembersTable.userId })
    .from(userGroupMembersTable)
    .where(eq(userGroupMembersTable.groupId, g.id));

  const memberIds = memberRows.map(r => r.userId);
  let members: { id: number; username: string; displayName: string | null; avatarUrl: string | null }[] = [];

  if (memberIds.length > 0) {
    const users = await db.select({
      id: usersTable.id,
      username: usersTable.robloxUsername,
      displayName: usersTable.robloxDisplayName,
      avatarUrl: usersTable.robloxAvatarUrl,
    }).from(usersTable).where(
      eq(usersTable.id, memberIds[0]!) // fallback — we'll do proper IN below
    );
    // Fetch all members properly
    const allUsers = await db.select({
      id: usersTable.id,
      username: usersTable.robloxUsername,
      displayName: usersTable.robloxDisplayName,
      avatarUrl: usersTable.robloxAvatarUrl,
    }).from(usersTable);
    const userMap = new Map(allUsers.map(u => [u.id, u]));
    members = memberIds.map(id => userMap.get(id)).filter(Boolean) as typeof members;
  }

  return {
    ...g,
    createdAt: g.createdAt.toISOString(),
    members,
  };
}

router.get("/user-groups", requireAuth, async (req, res): Promise<void> => {
  const groups = await db.select().from(userGroupsTable).orderBy(userGroupsTable.createdAt);

  const memberRows = await db.select().from(userGroupMembersTable);
  const allUsers = await db.select({
    id: usersTable.id,
    username: usersTable.robloxUsername,
    displayName: usersTable.robloxDisplayName,
    avatarUrl: usersTable.robloxAvatarUrl,
  }).from(usersTable);
  const userMap = new Map(allUsers.map(u => [u.id, u]));

  const serialized = groups.map(g => {
    const gMemberIds = memberRows.filter(r => r.groupId === g.id).map(r => r.userId);
    const members = gMemberIds.map(id => userMap.get(id)).filter(Boolean);
    return { ...g, createdAt: g.createdAt.toISOString(), members };
  });

  res.json(serialized);
});

router.post("/user-groups", requireAuth, async (req, res): Promise<void> => {
  if (req.user!.role !== "admin") {
    res.status(403).json({ error: "Admin only" });
    return;
  }

  const { name, description, color } = req.body as { name?: unknown; description?: unknown; color?: unknown };
  if (typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "name is required" });
    return;
  }

  const [group] = await db.insert(userGroupsTable).values({
    name: name.trim(),
    description: typeof description === "string" ? description.trim() || undefined : undefined,
    color: typeof color === "string" ? color.trim() || undefined : undefined,
  }).returning();

  res.status(201).json({ ...group!, createdAt: group!.createdAt.toISOString(), members: [] });
});

router.patch("/user-groups/:id", requireAuth, async (req, res): Promise<void> => {
  if (req.user!.role !== "admin") { res.status(403).json({ error: "Admin only" }); return; }
  const id = parseIntParam(req.params["id"]);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  const { name, description, color } = req.body as { name?: unknown; description?: unknown; color?: unknown };
  const update: Record<string, unknown> = {};
  if (typeof name === "string" && name.trim()) update["name"] = name.trim();
  if (typeof description === "string") update["description"] = description.trim() || null;
  if (typeof color === "string") update["color"] = color;

  if (Object.keys(update).length === 0) { res.status(400).json({ error: "Nothing to update" }); return; }

  const [group] = await db.update(userGroupsTable).set(update as any).where(eq(userGroupsTable.id, id)).returning();
  if (!group) { res.status(404).json({ error: "Group not found" }); return; }

  const memberRows = await db.select({ userId: userGroupMembersTable.userId }).from(userGroupMembersTable).where(eq(userGroupMembersTable.groupId, id));
  const allUsers = await db.select({ id: usersTable.id, username: usersTable.robloxUsername, displayName: usersTable.robloxDisplayName, avatarUrl: usersTable.robloxAvatarUrl }).from(usersTable);
  const userMap = new Map(allUsers.map(u => [u.id, u]));
  const members = memberRows.map(r => userMap.get(r.userId)).filter(Boolean);

  res.json({ ...group, createdAt: group.createdAt.toISOString(), members });
});

router.delete("/user-groups/:id", requireAuth, async (req, res): Promise<void> => {
  if (req.user!.role !== "admin") { res.status(403).json({ error: "Admin only" }); return; }
  const id = parseIntParam(req.params["id"]);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  const [group] = await db.delete(userGroupsTable).where(eq(userGroupsTable.id, id)).returning();
  if (!group) { res.status(404).json({ error: "Group not found" }); return; }
  res.sendStatus(204);
});

router.post("/user-groups/:id/members", requireAuth, async (req, res): Promise<void> => {
  if (req.user!.role !== "admin") { res.status(403).json({ error: "Admin only" }); return; }
  const groupId = parseIntParam(req.params["id"]);
  if (!groupId) { res.status(400).json({ error: "Invalid id" }); return; }

  const userId = parseIntParam(req.body?.userId);
  if (!userId) { res.status(400).json({ error: "userId is required" }); return; }

  const [exists] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, userId));
  if (!exists) { res.status(404).json({ error: "User not found" }); return; }

  try {
    const [member] = await db.insert(userGroupMembersTable).values({ groupId, userId }).returning();
    res.status(201).json(member);
  } catch {
    res.status(409).json({ error: "User already in group" });
  }
});

router.delete("/user-groups/:id/members/:userId", requireAuth, async (req, res): Promise<void> => {
  if (req.user!.role !== "admin") { res.status(403).json({ error: "Admin only" }); return; }
  const groupId = parseIntParam(req.params["id"]);
  const userId = parseIntParam(req.params["userId"]);
  if (!groupId || !userId) { res.status(400).json({ error: "Invalid params" }); return; }

  const [row] = await db.delete(userGroupMembersTable)
    .where(and(eq(userGroupMembersTable.groupId, groupId), eq(userGroupMembersTable.userId, userId)))
    .returning();
  if (!row) { res.status(404).json({ error: "Member not found" }); return; }
  res.sendStatus(204);
});

export default router;
