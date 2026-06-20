import { Router, type IRouter } from "express";
import { db, boardsTable, boardColumnsTable, tasksTable, calendarEventsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import {
  GetBoardParams,
  UpdateBoardParams,
  UpdateBoardBody,
  DeleteBoardParams,
  CreateBoardBody,
  ListTasksQueryParams,
  GetTaskParams,
  UpdateTaskParams,
  UpdateTaskBody,
  DeleteTaskParams,
  CreateTaskBody,
  ListEventsQueryParams,
  UpdateEventParams,
  UpdateEventBody,
  DeleteEventParams,
  CreateEventBody,
} from "@workspace/api-zod";

function parseIntParam(val: unknown): number | null {
  const n = Number(val);
  return Number.isInteger(n) && n > 0 ? n : null;
}

const router: IRouter = Router();

function serializeBoard(b: typeof boardsTable.$inferSelect) {
  return { ...b, createdAt: b.createdAt.toISOString() };
}

function serializeTask(t: typeof tasksTable.$inferSelect, assigneeUsername?: string | null) {
  return {
    ...t,
    assigneeUsername: assigneeUsername ?? null,
    createdAt: t.createdAt.toISOString(),
  };
}

function serializeEvent(e: typeof calendarEventsTable.$inferSelect) {
  return {
    ...e,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate ? e.endDate.toISOString() : null,
    createdAt: e.createdAt.toISOString(),
  };
}

router.get("/planning/boards", requireAuth, async (_req, res): Promise<void> => {
  const boards = await db.select().from(boardsTable).orderBy(boardsTable.createdAt);
  res.json(boards.map(serializeBoard));
});

router.post("/planning/boards", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateBoardBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [board] = await db.insert(boardsTable).values(parsed.data).returning();

  await db.insert(boardColumnsTable).values([
    { boardId: board.id, name: "To Do", position: 0 },
    { boardId: board.id, name: "In Progress", position: 1 },
    { boardId: board.id, name: "Done", position: 2 },
  ]);

  res.status(201).json(serializeBoard(board));
});

router.get("/planning/boards/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetBoardParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [board] = await db.select().from(boardsTable).where(eq(boardsTable.id, params.data.id));
  if (!board) {
    res.status(404).json({ error: "Board not found" });
    return;
  }

  const columns = await db.select().from(boardColumnsTable)
    .where(eq(boardColumnsTable.boardId, board.id))
    .orderBy(boardColumnsTable.position);

  const tasks = await db.select().from(tasksTable).where(eq(tasksTable.boardId, board.id));
  const users = await db.select().from(usersTable);

  const columnsWithTasks = columns.map(col => ({
    ...col,
    tasks: tasks
      .filter(t => t.columnId === col.id)
      .sort((a, b) => a.position - b.position)
      .map(t => {
        const assignee = users.find(u => u.id === t.assigneeId);
        return serializeTask(t, assignee?.robloxUsername);
      }),
  }));

  res.json({
    ...serializeBoard(board),
    columns: columnsWithTasks,
  });
});

router.patch("/planning/boards/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateBoardParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateBoardBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [board] = await db.update(boardsTable).set(parsed.data).where(eq(boardsTable.id, params.data.id)).returning();
  if (!board) {
    res.status(404).json({ error: "Board not found" });
    return;
  }
  res.json(serializeBoard(board));
});

router.delete("/planning/boards/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteBoardParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [board] = await db.delete(boardsTable).where(eq(boardsTable.id, params.data.id)).returning();
  if (!board) {
    res.status(404).json({ error: "Board not found" });
    return;
  }
  res.sendStatus(204);
});

// ── Column CRUD ──────────────────────────────────────────────────────────────

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
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let tasks;
  if (query.data.boardId != null) {
    tasks = await db.select().from(tasksTable).where(eq(tasksTable.boardId, query.data.boardId));
  } else {
    tasks = await db.select().from(tasksTable);
  }

  const users = await db.select().from(usersTable);
  res.json(tasks.map(t => {
    const assignee = users.find(u => u.id === t.assigneeId);
    return serializeTask(t, assignee?.robloxUsername);
  }));
});

router.post("/planning/tasks", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [task] = await db.insert(tasksTable).values({
    ...parsed.data,
    tags: parsed.data.tags ?? [],
  }).returning();
  res.status(201).json(serializeTask(task, null));
});

router.get("/planning/tasks/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, params.data.id));
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  const [assignee] = task.assigneeId
    ? await db.select().from(usersTable).where(eq(usersTable.id, task.assigneeId))
    : [null];
  res.json(serializeTask(task, assignee?.robloxUsername));
});

router.patch("/planning/tasks/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [task] = await db.update(tasksTable).set(parsed.data).where(eq(tasksTable.id, params.data.id)).returning();
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  const [assignee] = task.assigneeId
    ? await db.select().from(usersTable).where(eq(usersTable.id, task.assigneeId))
    : [null];
  res.json(serializeTask(task, assignee?.robloxUsername));
});

router.delete("/planning/tasks/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [task] = await db.delete(tasksTable).where(eq(tasksTable.id, params.data.id)).returning();
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/planning/events", requireAuth, async (req, res): Promise<void> => {
  const events = await db.select().from(calendarEventsTable).orderBy(calendarEventsTable.startDate);
  res.json(events.map(serializeEvent));
});

router.post("/planning/events", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [event] = await db.insert(calendarEventsTable).values({
    ...parsed.data,
    startDate: new Date(parsed.data.startDate),
    endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
    allDay: parsed.data.allDay ?? false,
  }).returning();
  res.status(201).json(serializeEvent(event));
});

router.patch("/planning/events/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateEventParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.startDate) updateData.startDate = new Date(parsed.data.startDate);
  if (parsed.data.endDate) updateData.endDate = new Date(parsed.data.endDate);
  if (parsed.data.endDate === null) updateData.endDate = null;

  const [event] = await db.update(calendarEventsTable).set(updateData as any).where(eq(calendarEventsTable.id, params.data.id)).returning();
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  res.json(serializeEvent(event));
});

router.delete("/planning/events/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteEventParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [event] = await db.delete(calendarEventsTable).where(eq(calendarEventsTable.id, params.data.id)).returning();
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
