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

/* ── Constants ────────────────────────────────────────────────────────────── */

const ROBLOX_ID_PATTERN = /^\d{1,20}$/;
const DISCORD_USERNAME_PATTERN = /^[a-zA-Z0-9_.]{1,32}$/;
const MAX_SUBROLE_LENGTH = 50;
const MAX_GROUP_LENGTH = 50;
const MAX_ARRAY_ITEMS = 20;

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function serializeUser(user: typeof usersTable.$inferSelect) {
  return {
    ...user,
    createdAt: user.createdAt.toISOString(),
  };
}

/**
 * Validates an array of user-supplied strings (subroles or groups).
 * Returns an error message if invalid, null if OK.
 */
function validateStringArray(
  values: string[] | undefined,
  label: string,
  maxLength: number,
): string | null {
  if (!values) return null;
  if (values.length > MAX_ARRAY_ITEMS) {
    return `${label}: maximum ${MAX_ARRAY_ITEMS} items allowed`;
  }
  for (const v of values) {
    if (typeof v !== "string") return `${label}: all values must be strings`;
    if (v.trim().length === 0) return `${label}: empty values are not allowed`;
    if (v.length > maxLength) {
      return `${label}: each value must be at most ${maxLength} characters`;
    }
  }
  return null;
}

async function fetchRobloxProfile(robloxId: string): Promise<{
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}> {
  try {
    const [userRes, avatarRes] = await Promise.all([
      fetch(`https://users.roblox.com/v1/users/${robloxId}`),
      fetch(
        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxId}&size=48x48&format=Png`,
      ),
    ]);

    let username = robloxId;
    let displayName: string | null = null;
    let avatarUrl: string | null = null;

    if (userRes.ok) {
      const data = (await userRes.json()) as {
        name?: string;
        displayName?: string;
      };
      username = data.name ?? robloxId;
      displayName = data.displayName ?? null;
    }

    if (avatarRes.ok) {
      const data = (await avatarRes.json()) as {
        data?: Array<{ imageUrl?: string }>;
      };
      avatarUrl = data.data?.[0]?.imageUrl ?? null;
    }

    return { username, displayName, avatarUrl };
  } catch {
    return { username: robloxId, displayName: null, avatarUrl: null };
  }
}

/* ── Routes ───────────────────────────────────────────────────────────────── */

router.get(
  "/users/preview/:robloxId",
  requireAuth,
  requireAdmin,
  async (req, res): Promise<void> => {
    const robloxId = String(req.params["robloxId"] ?? "");
    if (!robloxId || !ROBLOX_ID_PATTERN.test(robloxId)) {
      res.status(400).json({ error: "Invalid Roblox ID — must be numeric (max 20 digits)" });
      return;
    }
    try {
      const [userRes, avatarRes] = await Promise.all([
        fetch(`https://users.roblox.com/v1/users/${robloxId}`),
        fetch(
          `https://thumbnails.roblox.com/v1/users/avatar-bust?userIds=${robloxId}&size=420x420&format=Png`,
        ),
      ]);
      if (!userRes.ok) {
        res.status(404).json({ error: "Roblox user not found" });
        return;
      }
      const userData = (await userRes.json()) as {
        name?: string;
        displayName?: string;
        isBanned?: boolean;
      };
      let avatarUrl: string | null = null;
      if (avatarRes.ok) {
        const d = (await avatarRes.json()) as {
          data?: Array<{ imageUrl?: string }>;
        };
        avatarUrl = d.data?.[0]?.imageUrl ?? null;
      }
      res.json({
        robloxId,
        username: userData.name ?? robloxId,
        displayName: userData.displayName ?? null,
        avatarUrl,
        isBanned: userData.isBanned ?? false,
      });
    } catch (err) {
      req.log.error({ err }, "Failed to fetch Roblox profile preview");
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  },
);

router.get(
  "/users",
  requireAuth,
  requireAdmin,
  async (_req, res): Promise<void> => {
    const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
    res.json(users.map(serializeUser));
  },
);

router.post(
  "/users",
  requireAuth,
  requireAdmin,
  async (req, res): Promise<void> => {
    const parsed = CreateUserBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const { robloxId, role, discordUsername, subroles, groups } = parsed.data;

    if (!ROBLOX_ID_PATTERN.test(robloxId)) {
      res.status(400).json({ error: "Invalid Roblox ID format" });
      return;
    }

    if (discordUsername != null && !DISCORD_USERNAME_PATTERN.test(discordUsername)) {
      res.status(400).json({ error: "Invalid Discord username format" });
      return;
    }

    const subrolesError = validateStringArray(subroles, "Subroles", MAX_SUBROLE_LENGTH);
    if (subrolesError) {
      res.status(400).json({ error: subrolesError });
      return;
    }

    const groupsError = validateStringArray(groups, "Groups", MAX_GROUP_LENGTH);
    if (groupsError) {
      res.status(400).json({ error: groupsError });
      return;
    }

    const [existing] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.robloxId, robloxId));
    if (existing) {
      res.status(409).json({ error: "User with this Roblox ID already exists" });
      return;
    }

    const profile = await fetchRobloxProfile(robloxId);

    const [user] = await db
      .insert(usersTable)
      .values({
        robloxId,
        robloxUsername: profile.username,
        robloxDisplayName: profile.displayName,
        robloxAvatarUrl: profile.avatarUrl,
        discordUsername: discordUsername ?? null,
        role,
        subroles: subroles ?? [],
        groups: groups ?? [],
      })
      .returning();
    res.status(201).json(serializeUser(user));
  },
);

router.get(
  "/users/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = GetUserParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, params.data.id));
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(serializeUser(user));
  },
);

router.patch(
  "/users/:id",
  requireAuth,
  requireAdmin,
  async (req, res): Promise<void> => {
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

    const { role, discordUsername, subroles, groups } = parsed.data;

    if (discordUsername != null && !DISCORD_USERNAME_PATTERN.test(discordUsername)) {
      res.status(400).json({ error: "Invalid Discord username format" });
      return;
    }

    const subrolesError = validateStringArray(subroles, "Subroles", MAX_SUBROLE_LENGTH);
    if (subrolesError) {
      res.status(400).json({ error: subrolesError });
      return;
    }

    const groupsError = validateStringArray(groups, "Groups", MAX_GROUP_LENGTH);
    if (groupsError) {
      res.status(400).json({ error: groupsError });
      return;
    }

    const updateData: Partial<typeof usersTable.$inferInsert> = {};
    if (role !== undefined) updateData.role = role;
    if (discordUsername !== undefined) updateData.discordUsername = discordUsername;
    if (subroles !== undefined) updateData.subroles = subroles;
    if (groups !== undefined) updateData.groups = groups;

    const [user] = await db
      .update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, params.data.id))
      .returning();
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(serializeUser(user));
  },
);

router.delete(
  "/users/:id",
  requireAuth,
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = DeleteUserParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const [user] = await db
      .delete(usersTable)
      .where(eq(usersTable.id, params.data.id))
      .returning();
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.sendStatus(204);
  },
);

export default router;
