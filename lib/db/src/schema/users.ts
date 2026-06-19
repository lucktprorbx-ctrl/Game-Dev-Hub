import { pgTable, text, serial, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const roleEnum = pgEnum("role", ["admin", "collaborator"]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  robloxId: text("roblox_id").notNull().unique(),
  robloxUsername: text("roblox_username").notNull(),
  robloxDisplayName: text("roblox_display_name"),
  robloxAvatarUrl: text("roblox_avatar_url"),
  role: roleEnum("role").notNull().default("collaborator"),
  subroles: text("subroles").array().notNull().default([]),
  groups: text("groups").array().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

export const sessionsTable = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: serial("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Session = typeof sessionsTable.$inferSelect;
