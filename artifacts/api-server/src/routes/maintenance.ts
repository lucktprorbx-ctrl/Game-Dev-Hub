import { Router, type IRouter } from "express";
import { db, siteSettingsTable } from "@workspace/db";
import { requireAuth, requireAdmin } from "../middlewares/requireAuth";

const router: IRouter = Router();

async function getSettings() {
  const [row] = await db.select().from(siteSettingsTable).limit(1);
  if (row) return row;
  const [created] = await db.insert(siteSettingsTable).values({ maintenanceMode: false }).returning();
  return created;
}

router.get("/maintenance", async (_req, res): Promise<void> => {
  try {
    const settings = await getSettings();
    res.json({
      maintenanceMode: settings.maintenanceMode,
      message: settings.maintenanceMessage ?? null,
      updatedAt: settings.updatedAt,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch maintenance status" });
  }
});

router.put("/admin/maintenance", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const { maintenanceMode, message } = req.body as { maintenanceMode: unknown; message: unknown };

  if (typeof maintenanceMode !== "boolean") {
    res.status(400).json({ error: "maintenanceMode must be a boolean" });
    return;
  }
  if (message !== undefined && message !== null && typeof message !== "string") {
    res.status(400).json({ error: "message must be a string or null" });
    return;
  }
  const safeMessage = typeof message === "string" && message.trim().length > 0
    ? message.trim().slice(0, 500)
    : null;

  try {
    await getSettings();
    const [updated] = await db
      .update(siteSettingsTable)
      .set({
        maintenanceMode,
        maintenanceMessage: safeMessage,
        updatedAt: new Date(),
        updatedBy: req.user!.id,
      })
      .returning();
    res.json({
      maintenanceMode: updated.maintenanceMode,
      message: updated.maintenanceMessage ?? null,
      updatedAt: updated.updatedAt,
    });
  } catch {
    res.status(500).json({ error: "Failed to update maintenance status" });
  }
});

export default router;
