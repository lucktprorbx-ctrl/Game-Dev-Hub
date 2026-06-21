import { pgTable, text, serial, timestamp, integer, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const userGroupsTable = pgTable("user_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").notNull().default("#6366f1"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserGroupSchema = createInsertSchema(userGroupsTable).omit({ id: true, createdAt: true });
export type InsertUserGroup = z.infer<typeof insertUserGroupSchema>;
export type UserGroup = typeof userGroupsTable.$inferSelect;

export const userGroupMembersTable = pgTable("user_group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => userGroupsTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
}, (table) => [
  unique().on(table.groupId, table.userId),
]);

export type UserGroupMember = typeof userGroupMembersTable.$inferSelect;
