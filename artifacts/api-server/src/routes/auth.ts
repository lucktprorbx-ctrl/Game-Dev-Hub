import { Router, type IRouter } from "express";
import { db, usersTable, sessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";
import crypto from "crypto";

const router: IRouter = Router();

const ROBLOX_CLIENT_ID = process.env.ROBLOX_CLIENT_ID!;
const ROBLOX_CLIENT_SECRET = process.env.ROBLOX_CLIENT_SECRET!;
const SESSION_SECRET = process.env.SESSION_SECRET ?? "dev-secret-change-me";
const BASE_URL = process.env.REPLIT_DOMAINS
  ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
  : "http://localhost:5000";
const REDIRECT_URI =
  process.env.ROBLOX_REDIRECT_URI ?? `${BASE_URL}/api/auth/roblox/callback`;

const HARDCODED_ADMINS = ["454458772", "1428066981", "2001745284"];
const HARDCODED_COLLABORATORS = ["3080402841", "9690401925"];

function generateSessionId() {
  return crypto.randomBytes(32).toString("hex");
}

router.get("/auth/roblox", (req, res): void => {
  const state = crypto.randomBytes(16).toString("hex");
  const params = new URLSearchParams({
    client_id: ROBLOX_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: "openid profile",
    state,
  });
  res.redirect(`https://apis.roblox.com/oauth/v1/authorize?${params.toString()}`);
});

router.get("/auth/roblox/callback", async (req, res): Promise<void> => {
  const { code, error } = req.query as Record<string, string>;

  if (error || !code) {
    req.log.warn({ error }, "Roblox OAuth error");
    res.redirect("/?auth_error=true");
    return;
  }

  try {
    const tokenRes = await fetch("https://apis.roblox.com/oauth/v1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: ROBLOX_CLIENT_ID,
        client_secret: ROBLOX_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        code,
      }),
    });

    if (!tokenRes.ok) {
      const body = await tokenRes.text();
      req.log.error(
        {
          status: tokenRes.status,
          body,
          redirectUri: REDIRECT_URI,
          clientIdPrefix: ROBLOX_CLIENT_ID?.slice(0, 6),
          hasSecret: !!ROBLOX_CLIENT_SECRET,
        },
        "Token exchange failed",
      );
      res.redirect("/?auth_error=true");
      return;
    }

    const tokens = await tokenRes.json() as { access_token: string; id_token?: string };

    const userInfoRes = await fetch("https://apis.roblox.com/oauth/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoRes.ok) {
      req.log.error({ status: userInfoRes.status }, "Userinfo fetch failed");
      res.redirect("/?auth_error=true");
      return;
    }

    const userInfo = await userInfoRes.json() as {
      sub: string;
      preferred_username: string;
      display_name?: string;
      picture?: string;
    };

    const robloxId = userInfo.sub;

    // Determine role from hardcoded lists (takes priority)
    const isHardcodedAdmin = HARDCODED_ADMINS.includes(robloxId);
    const isHardcodedCollaborator = HARDCODED_COLLABORATORS.includes(robloxId);
    const isHardcoded = isHardcodedAdmin || isHardcodedCollaborator;

    let [user] = await db.select().from(usersTable).where(eq(usersTable.robloxId, robloxId));

    if (!user) {
      // New user: assign role from hardcoded lists, default to collaborator
      let role: "admin" | "collaborator" = "collaborator";
      if (isHardcodedAdmin) role = "admin";

      const [created] = await db.insert(usersTable).values({
        robloxId,
        robloxUsername: userInfo.preferred_username,
        robloxDisplayName: userInfo.display_name ?? null,
        robloxAvatarUrl: userInfo.picture ?? null,
        role,
        subroles: [],
        groups: [],
      }).returning();
      user = created;
    } else {
      // Existing user: always update profile info.
      // Only override the role if the user is in the hardcoded lists.
      // Otherwise, preserve the role assigned by an admin.
      const updatedRole = isHardcoded
        ? (isHardcodedAdmin ? "admin" : "collaborator")
        : user.role;

      const [updated] = await db.update(usersTable).set({
        robloxUsername: userInfo.preferred_username,
        robloxDisplayName: userInfo.display_name ?? null,
        robloxAvatarUrl: userInfo.picture ?? null,
        role: updatedRole,
      }).where(eq(usersTable.id, user.id)).returning();
      user = updated;
    }

    const sessionId = generateSessionId();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.insert(sessionsTable).values({
      id: sessionId,
      userId: user.id,
      expiresAt,
    });

    res.cookie("session_id", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    res.redirect("/");
  } catch (err) {
    req.log.error({ err }, "OAuth callback error");
    res.redirect("/?auth_error=true");
  }
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const sessionId = req.cookies?.session_id;
  if (!sessionId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, sessionId));
  if (!session || session.expiresAt < new Date()) {
    res.status(401).json({ error: "Session expired" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  res.json({
    id: user.id,
    robloxId: user.robloxId,
    robloxUsername: user.robloxUsername,
    robloxDisplayName: user.robloxDisplayName,
    robloxAvatarUrl: user.robloxAvatarUrl,
    role: user.role,
    subroles: user.subroles,
    groups: user.groups,
    createdAt: user.createdAt.toISOString(),
  });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  const sessionId = req.cookies?.session_id;
  if (sessionId) {
    await db.delete(sessionsTable).where(eq(sessionsTable.id, sessionId));
  }
  res.clearCookie("session_id", { path: "/" });
  res.json({ ok: true });
});

export default router;
