---
name: dueDate column type mismatch
description: tasksTable.dueDate is text in DB but Orval generates Date from format:date in OpenAPI spec
---

## Rule
`tasksTable.dueDate` is `text("due_date")` in Drizzle schema (stores as string).
The OpenAPI spec has `dueDate: { type: string, format: date }` which Orval generates as `Date` in TypeScript.

When inserting/updating tasks, convert explicitly:
```ts
const { dueDate: rawDueDate, ...rest } = parsed.data;
// insert/update with:
dueDate: rawDueDate != null ? String(rawDueDate) : null
```

**Why:** Drizzle maps `text()` to `string` but Orval maps `format: date` to `Date`. The mismatch causes TS2769 on `.values()` calls.
