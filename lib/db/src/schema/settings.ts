import { pgTable, serial, boolean, text, timestamp, integer } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const siteSettingsTable = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  maintenanceMode: boolean("maintenance_mode").notNull().default(false),
  maintenanceMessage: text("maintenance_message"),
  customSubroles: text("custom_subroles").default("[]").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: integer("updated_by").references(() => usersTable.id, { onDelete: "set null" }),
});

export type SiteSettings = typeof siteSettingsTable.$inferSelect;
