import { Router, type IRouter } from "express";
import { db, boardsTable, boardColumnsTable, tasksTable, calendarEventsTable, usersTable, boardNotesTable, teamMembersTable, teamsTable } from "@workspace/db";
import { eq, and, isNull, inArray, or } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import {
  GetBoardParams,
  UpdateBoardParams,
  UpdateBoardBody,
  DeleteBoardParams,
  ListTasksQueryParams,
  GetTaskParams,
  UpdateTaskParams,
  DeleteTaskParams,
  ListEventsQueryParams,
  UpdateEventParams,
  DeleteEventParams,
} from "@workspace/api-zod";

function parseIntParam(val: unknown): number | null {
  const n = Number(val);
  return Number.isInteger(n) && n > 0 ? n : null;
}

const router: IRouter = Router();

// ── Helpers ───────────────────────────────────────────────────────────────────

type DbUser = typeof usersTable.$inferSelect;

function serializeUserInfo(u: DbUser | null | undefined) {
  if (!u) return null;
  return {
    id: u.id,
    username: u.robloxUsername,
    displayName: u.robloxDisplayName,
    avatarUrl: u.robloxAvatarUrl,
    role: u.role,
    subroles: u.subroles ?? [],
  };
}

function serializeBoard(b: typeof boardsTable.$inferSelect, teamName?: string | null) {
  return {
    ...b,
    allowedUserIds: b.allowedUserIds ?? [],
    teamName: teamName ?? null,
    createdAt: b.createdAt.toISOString(),
  };
}

function serializeTask(
  t: typeof tasksTable.$inferSelect,
  assignees: DbUser[],
  createdBy?: DbUser | null,
) {
  return {
    ...t,
    assigneeIds: t.assigneeIds ?? [],
    assignees: assignees.map(serializeUserInfo),
    createdBy: serializeUserInfo(createdBy),
    createdAt: t.createdAt.toISOString(),
  };
}

function serializeEvent(
  e: typeof calendarEventsTable.$inferSelect,
  attendees: DbUser[],
  createdBy?: DbUser | null,
) {
  return {
    ...e,
    attendeeIds: e.attendeeIds ?? [],
    attendees: attendees.map(serializeUserInfo),
    createdBy: serializeUserInfo(createdBy),
    startDate: e.startDate.toISOString(),
    endDate: e.endDate ? e.endDate.toISOString() : null,
    createdAt: e.createdAt.toISOString(),
  };
}

function serializeNote(
  n: typeof boardNotesTable.$inferSelect,
  createdBy?: DbUser | null,
) {
  return {
    ...n,
    createdBy: serializeUserInfo(createdBy),
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
  };
}

async function getUserMap(): Promise<Map<number, DbUser>> {
  const users = await db.select().from(usersTable);
  return new Map(users.map((u) => [u.id, u]));
}

async function getUserTeamIds(userId: number): Promise<number[]> {
  const rows = await db
    .select({ teamId: teamMembersTable.teamId })
    .from(teamMembersTable)
    .where(eq(teamMembersTable.userId, userId));
  return rows.map(r => r.teamId);
}

async function getTeamNameMap(): Promise<Map<number, string>> {
  const teams = await db.select({ id: teamsTable.id, name: teamsTable.name }).from(teamsTable);
  return new Map(teams.map(t => [t.id, t.name]));
}

// Resolve assignee IDs to user objects from a userMap
function resolveUsers(ids: number[] | null | undefined, userMap: Map<number, DbUser>): DbUser[] {
  if (!ids || ids.length === 0) return [];
  return ids.map(id => userMap.get(id)).filter((u): u is DbUser => Boolean(u));
}

// Check if user can access a specific board
async function canAccessBoard(userId: number, role: string, boardId: number): Promise<boolean> {
  if (role === "admin") return true;
  const [board] = await db
    .select({ teamId: boardsTable.teamId, allowedUserIds: boardsTable.allowedUserIds })
    .from(boardsTable)
    .where(eq(boardsTable.id, boardId));
  if (!board) return false;

  const allowed = board.allowedUserIds ?? [];
  if (allowed.length > 0) {
    return allowed.includes(userId);
  }
  if (board.teamId === null) return true; // public board
  const teamIds = await getUserTeamIds(userId);
  return teamIds.includes(board.teamId);
}

// ── Boards ────────────────────────────────────────────────────────────────────

router.get("/planning/boards", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  const isAdmin = user.role === "admin";

  let boards: typeof boardsTable.$inferSelect[];

  if (isAdmin) {
    boards = await db.select().from(boardsTable).orderBy(boardsTable.createdAt);
  } else {
    const allBoards = await db.select().from(boardsTable).orderBy(boardsTable.createdAt);
    const teamIds = await getUserTeamIds(user.id);
    boards = allBoards.filter(b => {
      const allowed = b.allowedUserIds ?? [];
      if (allowed.length > 0) return allowed.includes(user.id);
      if (b.teamId === null) return true;
      return teamIds.includes(b.teamId);
    });
  }

  const teamNameMap = await getTeamNameMap();
  res.json(boards.map(b => serializeBoard(b, b.teamId ? teamNameMap.get(b.teamId) : null)));
});

router.post("/planning/boards", requireAuth, async (req, res): Promise<void> => {
  const { name, description, color, teamId, allowedUserIds } = req.body as {
    name?: unknown; description?: unknown; color?: unknown; teamId?: unknown; allowedUserIds?: unknown;
  };

  if (typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "name is required" });
    return;
  }

  const parsedTeamId = teamId != null ? parseIntParam(teamId) : null;
  const parsedAllowedUserIds = Array.isArray(allowedUserIds)
    ? (allowedUserIds as unknown[]).map(id => parseIntParam(id)).filter((id): id is number => id !== null)
    : [];

  const [board] = await db.insert(boardsTable).values({
    name: name.trim(),
    description: typeof description === "string" ? description.trim() || null : null,
    color: typeof color === "string" ? color.trim() || null : null,
    teamId: parsedTeamId,
    allowedUserIds: parsedAllowedUserIds,
  }).returning();

  await db.insert(boardColumnsTable).values([
    { boardId: board.id, name: "To Do", position: 0 },
    { boardId: board.id, name: "In Progress", position: 1 },
    { boardId: board.id, name: "Done", position: 2 },
  ]);

  const teamNameMap = await getTeamNameMap();
  res.status(201).json(serializeBoard(board, board.teamId ? teamNameMap.get(board.teamId) : null));
});

router.get("/planning/boards/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetBoardParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const user = req.user!;
  const hasAccess = await canAccessBoard(user.id, user.role, params.data.id);
  if (!hasAccess) { res.status(403).json({ error: "Access denied" }); return; }

  const [board] = await db.select().from(boardsTable).where(eq(boardsTable.id, params.data.id));
  if (!board) { res.status(404).json({ error: "Board not found" }); return; }

  const columns = await db.select().from(boardColumnsTable)
    .where(eq(boardColumnsTable.boardId, board.id))
    .orderBy(boardColumnsTable.position);

  const tasks = await db.select().from(tasksTable).where(eq(tasksTable.boardId, board.id));
  const userMap = await getUserMap();
  const teamNameMap = await getTeamNameMap();

  const columnsWithTasks = columns.map((col) => ({
    ...col,
    tasks: tasks
      .filter((t) => t.columnId === col.id)
      .sort((a, b) => a.position - b.position)
      .map((t) => serializeTask(
        t,
        resolveUsers(t.assigneeIds, userMap),
        t.createdById ? userMap.get(t.createdById) : null,
      )),
  }));

  const serialized = serializeBoard(board, board.teamId ? teamNameMap.get(board.teamId) : null);
  res.json({ ...serialized, columns: columnsWithTasks });
});

router.patch("/planning/boards/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateBoardParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const user = req.user!;
  const hasAccess = await canAccessBoard(user.id, user.role, params.data.id);
  if (!hasAccess) { res.status(403).json({ error: "Access denied" }); return; }

  const parsed = UpdateBoardBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const update: Record<string, unknown> = { ...parsed.data };
  if (user.role === "admin" && "teamId" in req.body) {
    update.teamId = req.body.teamId != null ? parseIntParam(req.body.teamId) : null;
  }
  if (user.role === "admin" && "allowedUserIds" in req.body) {
    const raw = req.body.allowedUserIds;
    update.allowedUserIds = Array.isArray(raw)
      ? (raw as unknown[]).map(id => parseIntParam(id)).filter((id): id is number => id !== null)
      : [];
  }

  const [board] = await db.update(boardsTable).set(update as any).where(eq(boardsTable.id, params.data.id)).returning();
  if (!board) { res.status(404).json({ error: "Board not found" }); return; }

  const teamNameMap = await getTeamNameMap();
  res.json(serializeBoard(board, board.teamId ? teamNameMap.get(board.teamId) : null));
});

router.delete("/planning/boards/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteBoardParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const user = req.user!;
  if (user.role !== "admin") {
    const hasAccess = await canAccessBoard(user.id, user.role, params.data.id);
    if (!hasAccess) { res.status(403).json({ error: "Access denied" }); return; }
  }

  const [board] = await db.delete(boardsTable).where(eq(boardsTable.id, params.data.id)).returning();
  if (!board) { res.status(404).json({ error: "Board not found" }); return; }
  res.sendStatus(204);
});

// ── Columns ───────────────────────────────────────────────────────────────────

router.post("/planning/boards/:boardId/columns", requireAuth, async (req, res): Promise<void> => {
  const boardId = parseIntParam(req.params["boardId"]);
  if (!boardId) { res.status(400).json({ error: "Invalid boardId" }); return; }
  const { name, position: posInput } = req.body as { name?: unknown; position?: unknown };
  if (typeof name !== "string" || !name.trim()) { res.status(400).json({ error: "name is required" }); return; }

  let position: number;
  if (posInput !== undefined && typeof posInput === "number") {
    position = Math.floor(posInput);
  } else {
    const cols = await db.select().from(boardColumnsTable).where(eq(boardColumnsTable.boardId, boardId));
    position = cols.length;
  }
  const [col] = await db.insert(boardColumnsTable).values({ boardId, name: name.trim(), position }).returning();
  res.status(201).json(col);
});

router.patch("/planning/columns/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseIntParam(req.params["id"]);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }
  const { name, position } = req.body as { name?: unknown; position?: unknown };
  const update: Record<string, unknown> = {};
  if (typeof name === "string" && name.trim()) update["name"] = name.trim();
  if (typeof position === "number") update["position"] = Math.floor(position);
  if (Object.keys(update).length === 0) { res.status(400).json({ error: "Nothing to update" }); return; }

  const [col] = await db.update(boardColumnsTable).set(update as any).where(eq(boardColumnsTable.id, id)).returning();
  if (!col) { res.status(404).json({ error: "Column not found" }); return; }
  res.json(col);
});

router.delete("/planning/columns/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseIntParam(req.params["id"]);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }
  const [col] = await db.delete(boardColumnsTable).where(eq(boardColumnsTable.id, id)).returning();
  if (!col) { res.status(404).json({ error: "Column not found" }); return; }
  res.sendStatus(204);
});

// ── Tasks ─────────────────────────────────────────────────────────────────────

router.get("/planning/tasks", requireAuth, async (req, res): Promise<void> => {
  const query = ListTasksQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }

  const tasks = query.data.boardId != null
    ? await db.select().from(tasksTable).where(eq(tasksTable.boardId, query.data.boardId))
    : await db.select().from(tasksTable);

  const userMap = await getUserMap();
  res.json(tasks.map((t) => serializeTask(
    t,
    resolveUsers(t.assigneeIds, userMap),
    t.createdById ? userMap.get(t.createdById) : null,
  )));
});

router.post("/planning/tasks", requireAuth, async (req, res): Promise<void> => {
  const body = req.body as {
    boardId?: unknown; columnId?: unknown; title?: unknown; description?: unknown;
    assigneeIds?: unknown; priority?: unknown; dueDate?: unknown; tags?: unknown;
  };

  const boardId = parseIntParam(body.boardId);
  const columnId = parseIntParam(body.columnId);
  if (!boardId || !columnId) { res.status(400).json({ error: "boardId and columnId are required" }); return; }
  if (typeof body.title !== "string" || !body.title.trim()) { res.status(400).json({ error: "title is required" }); return; }

  const assigneeIds = Array.isArray(body.assigneeIds)
    ? (body.assigneeIds as unknown[]).map(id => parseIntParam(id)).filter((id): id is number => id !== null)
    : [];
  const tags = Array.isArray(body.tags) ? (body.tags as unknown[]).filter((t): t is string => typeof t === "string") : [];
  const priority = ["low", "medium", "high"].includes(body.priority as string) ? body.priority as "low" | "medium" | "high" : null;

  // Compute position
  const existingTasks = await db.select({ position: tasksTable.position })
    .from(tasksTable).where(eq(tasksTable.columnId, columnId));
  const position = existingTasks.length > 0 ? Math.max(...existingTasks.map(t => t.position)) + 1 : 0;

  const [task] = await db.insert(tasksTable).values({
    boardId,
    columnId,
    title: body.title.trim(),
    description: typeof body.description === "string" ? body.description.trim() || null : null,
    assigneeIds,
    priority,
    dueDate: typeof body.dueDate === "string" ? body.dueDate || null : null,
    tags,
    position,
    createdById: req.user!.id,
  }).returning();

  const userMap = await getUserMap();
  res.status(201).json(serializeTask(task, resolveUsers(task.assigneeIds, userMap), userMap.get(req.user!.id)));
});

router.get("/planning/tasks/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetTaskParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, params.data.id));
  if (!task) { res.status(404).json({ error: "Task not found" }); return; }

  const userMap = await getUserMap();
  res.json(serializeTask(task, resolveUsers(task.assigneeIds, userMap), task.createdById ? userMap.get(task.createdById) : null));
});

router.patch("/planning/tasks/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateTaskParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const body = req.body as {
    columnId?: unknown; title?: unknown; description?: unknown;
    assigneeIds?: unknown; priority?: unknown; dueDate?: unknown;
    position?: unknown; tags?: unknown;
  };

  const update: Record<string, unknown> = {};
  if (body.columnId != null) { const v = parseIntParam(body.columnId); if (v) update["columnId"] = v; }
  if (typeof body.title === "string" && body.title.trim()) update["title"] = body.title.trim();
  if ("description" in body) update["description"] = typeof body.description === "string" ? body.description.trim() || null : null;
  if ("assigneeIds" in body) {
    update["assigneeIds"] = Array.isArray(body.assigneeIds)
      ? (body.assigneeIds as unknown[]).map(id => parseIntParam(id)).filter((id): id is number => id !== null)
      : [];
  }
  if ("priority" in body) {
    update["priority"] = ["low", "medium", "high"].includes(body.priority as string) ? body.priority : null;
  }
  if ("dueDate" in body) {
    update["dueDate"] = typeof body.dueDate === "string" ? body.dueDate || null : null;
  }
  if (typeof body.position === "number") update["position"] = Math.floor(body.position);
  if (Array.isArray(body.tags)) {
    update["tags"] = (body.tags as unknown[]).filter((t): t is string => typeof t === "string");
  }

  if (Object.keys(update).length === 0) { res.status(400).json({ error: "Nothing to update" }); return; }

  const [task] = await db.update(tasksTable).set(update as any).where(eq(tasksTable.id, params.data.id)).returning();
  if (!task) { res.status(404).json({ error: "Task not found" }); return; }

  const userMap = await getUserMap();
  res.json(serializeTask(task, resolveUsers(task.assigneeIds, userMap), task.createdById ? userMap.get(task.createdById) : null));
});

router.delete("/planning/tasks/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteTaskParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [task] = await db.delete(tasksTable).where(eq(tasksTable.id, params.data.id)).returning();
  if (!task) { res.status(404).json({ error: "Task not found" }); return; }
  res.sendStatus(204);
});

// ── Notes ─────────────────────────────────────────────────────────────────────

router.get("/planning/boards/:boardId/notes", requireAuth, async (req, res): Promise<void> => {
  const boardId = parseIntParam(req.params["boardId"]);
  if (!boardId) { res.status(400).json({ error: "Invalid boardId" }); return; }

  const user = req.user!;
  const hasAccess = await canAccessBoard(user.id, user.role, boardId);
  if (!hasAccess) { res.status(403).json({ error: "Access denied" }); return; }

  const notes = await db.select().from(boardNotesTable)
    .where(eq(boardNotesTable.boardId, boardId))
    .orderBy(boardNotesTable.createdAt);

  const userMap = await getUserMap();
  res.json(notes.map((n) => serializeNote(n, n.createdById ? userMap.get(n.createdById) : null)));
});

router.post("/planning/boards/:boardId/notes", requireAuth, async (req, res): Promise<void> => {
  const boardId = parseIntParam(req.params["boardId"]);
  if (!boardId) { res.status(400).json({ error: "Invalid boardId" }); return; }

  const user = req.user!;
  const hasAccess = await canAccessBoard(user.id, user.role, boardId);
  if (!hasAccess) { res.status(403).json({ error: "Access denied" }); return; }

  const { title, content } = req.body as { title?: unknown; content?: unknown };
  if (typeof title !== "string" || !title.trim()) { res.status(400).json({ error: "title is required" }); return; }

  const [note] = await db.insert(boardNotesTable).values({
    boardId,
    createdById: req.user!.id,
    title: title.trim(),
    content: typeof content === "string" ? content : "",
  }).returning();

  const userMap = await getUserMap();
  res.status(201).json(serializeNote(note, userMap.get(req.user!.id)));
});

router.patch("/planning/notes/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseIntParam(req.params["id"]);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }
  const { title, content } = req.body as { title?: unknown; content?: unknown };
  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof title === "string" && title.trim()) update["title"] = title.trim();
  if (typeof content === "string") update["content"] = content;

  const [note] = await db.update(boardNotesTable).set(update as any).where(eq(boardNotesTable.id, id)).returning();
  if (!note) { res.status(404).json({ error: "Note not found" }); return; }

  const userMap = await getUserMap();
  res.json(serializeNote(note, note.createdById ? userMap.get(note.createdById) : null));
});

router.delete("/planning/notes/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseIntParam(req.params["id"]);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }
  const [note] = await db.delete(boardNotesTable).where(eq(boardNotesTable.id, id)).returning();
  if (!note) { res.status(404).json({ error: "Note not found" }); return; }
  res.sendStatus(204);
});

// ── Calendar Events ───────────────────────────────────────────────────────────

router.get("/planning/events", requireAuth, async (req, res): Promise<void> => {
  const query = ListEventsQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }

  const user = req.user!;
  const isAdmin = user.role === "admin";

  let events: typeof calendarEventsTable.$inferSelect[];
  if (isAdmin) {
    events = await db.select().from(calendarEventsTable).orderBy(calendarEventsTable.startDate);
  } else {
    const teamIds = await getUserTeamIds(user.id);
    if (teamIds.length === 0) {
      events = await db.select().from(calendarEventsTable)
        .where(isNull(calendarEventsTable.teamId))
        .orderBy(calendarEventsTable.startDate);
    } else {
      events = await db.select().from(calendarEventsTable)
        .where(or(isNull(calendarEventsTable.teamId), inArray(calendarEventsTable.teamId, teamIds)))
        .orderBy(calendarEventsTable.startDate);
    }
  }

  const userMap = await getUserMap();
  res.json(events.map((e) => serializeEvent(
    e,
    resolveUsers(e.attendeeIds, userMap),
    e.createdById ? userMap.get(e.createdById) : null,
  )));
});

router.post("/planning/events", requireAuth, async (req, res): Promise<void> => {
  const body = req.body as {
    title?: unknown; description?: unknown; startDate?: unknown; endDate?: unknown;
    color?: unknown; attendeeIds?: unknown; allDay?: unknown; teamId?: unknown;
  };

  if (typeof body.title !== "string" || !body.title.trim()) {
    res.status(400).json({ error: "title is required" });
    return;
  }
  if (typeof body.startDate !== "string" || !body.startDate) {
    res.status(400).json({ error: "startDate is required" });
    return;
  }

  const attendeeIds = Array.isArray(body.attendeeIds)
    ? (body.attendeeIds as unknown[]).map(id => parseIntParam(id)).filter((id): id is number => id !== null)
    : [];
  const teamId = body.teamId != null ? parseIntParam(body.teamId) : null;

  const [event] = await db.insert(calendarEventsTable).values({
    title: body.title.trim(),
    description: typeof body.description === "string" ? body.description.trim() || null : null,
    startDate: new Date(body.startDate),
    endDate: typeof body.endDate === "string" && body.endDate ? new Date(body.endDate) : null,
    color: typeof body.color === "string" ? body.color || null : null,
    attendeeIds,
    allDay: body.allDay === true,
    teamId,
    createdById: req.user!.id,
  }).returning();

  const userMap = await getUserMap();
  res.status(201).json(serializeEvent(event, resolveUsers(event.attendeeIds, userMap), userMap.get(req.user!.id)));
});

router.patch("/planning/events/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateEventParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const body = req.body as {
    title?: unknown; description?: unknown; startDate?: unknown; endDate?: unknown;
    color?: unknown; attendeeIds?: unknown; allDay?: unknown;
  };

  const update: Record<string, unknown> = {};
  if (typeof body.title === "string" && body.title.trim()) update["title"] = body.title.trim();
  if ("description" in body) update["description"] = typeof body.description === "string" ? body.description.trim() || null : null;
  if (typeof body.startDate === "string" && body.startDate) update["startDate"] = new Date(body.startDate);
  if ("endDate" in body) update["endDate"] = typeof body.endDate === "string" && body.endDate ? new Date(body.endDate) : null;
  if ("color" in body) update["color"] = typeof body.color === "string" ? body.color || null : null;
  if ("attendeeIds" in body) {
    update["attendeeIds"] = Array.isArray(body.attendeeIds)
      ? (body.attendeeIds as unknown[]).map(id => parseIntParam(id)).filter((id): id is number => id !== null)
      : [];
  }
  if ("allDay" in body) update["allDay"] = body.allDay === true;

  const [event] = await db.update(calendarEventsTable).set(update as any).where(eq(calendarEventsTable.id, params.data.id)).returning();
  if (!event) { res.status(404).json({ error: "Event not found" }); return; }

  const userMap = await getUserMap();
  res.json(serializeEvent(event, resolveUsers(event.attendeeIds, userMap), event.createdById ? userMap.get(event.createdById) : null));
});

router.delete("/planning/events/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteEventParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [event] = await db.delete(calendarEventsTable).where(eq(calendarEventsTable.id, params.data.id)).returning();
  if (!event) { res.status(404).json({ error: "Event not found" }); return; }
  res.sendStatus(204);
});

export default router;
