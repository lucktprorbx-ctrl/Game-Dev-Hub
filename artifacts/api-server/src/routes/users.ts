import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/requireAuth";
import {
  GetUserParams,
  UpdateUserParams,
  UpdateUserBody,
  DeleteUserParams,
  CreateUserBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serializeUser(user: typeof usersTable.$inferSelect) {
  return {
    ...user,
    createdAt: user.createdAt.toISOString(),
  };
}

async function fetchRobloxProfile(robloxId: string): Promise<{
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}> {
  try {
    const [userRes, avatarRes] = await Promise.all([
      fetch(`https://users.roblox.com/v1/users/${robloxId}`),
      fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxId}&size=48x48&format=Png`),
    ]);

    let username = robloxId;
    let displayName: string | null = null;
    let avatarUrl: string | null = null;

    if (userRes.ok) {
      const data = await userRes.json() as { name?: string; displayName?: string };
      username = data.name ?? robloxId;
      displayName = data.displayName ?? null;
    }

    if (avatarRes.ok) {
      const data = await avatarRes.json() as { data?: Array<{ imageUrl?: string }> };
      avatarUrl = data.data?.[0]?.imageUrl ?? null;
    }

    return { username, displayName, avatarUrl };
  } catch {
    return { username: robloxId, displayName: null, avatarUrl: null };
  }
}

router.get("/users", requireAuth, requireAdmin, async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  res.json(users.map(serializeUser));
});

router.post("/users", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.robloxId, parsed.data.robloxId));
  if (existing) {
    res.status(409).json({ error: "User with this Roblox ID already exists" });
    return;
  }

  const profile = await fetchRobloxProfile(parsed.data.robloxId);

  const [user] = await db.insert(usersTable).values({
    robloxId: parsed.data.robloxId,
    robloxUsername: profile.username,
    robloxDisplayName: profile.displayName,
    robloxAvatarUrl: profile.avatarUrl,
    role: parsed.data.role,
    subroles: parsed.data.subroles ?? [],
    groups: parsed.data.groups ?? [],
  }).returning();
  res.status(201).json(serializeUser(user));
});

router.get("/users/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(serializeUser(user));
});

router.patch("/users/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [user] = await db.update(usersTable).set(parsed.data).where(eq(usersTable.id, params.data.id)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(serializeUser(user));
});

router.delete("/users/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [user] = await db.delete(usersTable).where(eq(usersTable.id, params.data.id)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
