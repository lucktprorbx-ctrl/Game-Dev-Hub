import { Router, type IRouter } from "express";
import { db, siteSettingsTable } from "@workspace/db";
import { requireAuth, requireAdmin } from "../middlewares/requireAuth";
import crypto from "crypto";

const router: IRouter = Router();

export type CustomSubrole = { id: string; name: string; color: string };

async function getSubroles(): Promise<CustomSubrole[]> {
  const [row] = await db.select({ customSubroles: siteSettingsTable.customSubroles }).from(siteSettingsTable).limit(1);
  if (!row) return [];
  try { return JSON.parse(row.customSubroles) as CustomSubrole[]; } catch { return []; }
}

async function saveSubroles(subroles: CustomSubrole[]) {
  const [row] = await db.select({ id: siteSettingsTable.id }).from(siteSettingsTable).limit(1);
  if (row) {
    await db.update(siteSettingsTable).set({ customSubroles: JSON.stringify(subroles) });
  } else {
    await db.insert(siteSettingsTable).values({ maintenanceMode: false, customSubroles: JSON.stringify(subroles) });
  }
}

router.get("/subroles", requireAuth, async (_req, res): Promise<void> => {
  try {
    res.json(await getSubroles());
  } catch {
    res.status(500).json({ error: "Failed to fetch subroles" });
  }
});

router.post("/subroles", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const { name, color } = req.body as { name?: unknown; color?: unknown };
  if (typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  const subroles = await getSubroles();
  if (subroles.some(s => s.name.toLowerCase() === name.trim().toLowerCase())) {
    res.status(409).json({ error: "Subrole already exists" });
    return;
  }
  const newSubrole: CustomSubrole = {
    id: crypto.randomUUID(),
    name: name.trim(),
    color: typeof color === "string" && color.trim() ? color.trim() : "#6366f1",
  };
  subroles.push(newSubrole);
  await saveSubroles(subroles);
  res.status(201).json(newSubrole);
});

router.patch("/subroles/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const { id } = req.params;
  const { name, color } = req.body as { name?: unknown; color?: unknown };
  const subroles = await getSubroles();
  const idx = subroles.findIndex(s => s.id === id);
  if (idx === -1) { res.status(404).json({ error: "Subrole not found" }); return; }
  if (typeof name === "string" && name.trim()) subroles[idx]!.name = name.trim();
  if (typeof color === "string" && color.trim()) subroles[idx]!.color = color.trim();
  await saveSubroles(subroles);
  res.json(subroles[idx]);
});

router.delete("/subroles/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const { id } = req.params;
  const subroles = await getSubroles();
  const filtered = subroles.filter(s => s.id !== id);
  if (filtered.length === subroles.length) { res.status(404).json({ error: "Subrole not found" }); return; }
  await saveSubroles(filtered);
  res.sendStatus(204);
});

export default router;
