import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const siteUsers = pgTable("site_users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash"),
  status: integer("status").notNull().default(1),
  isAdmin: boolean("is_admin").default(false),
  isMuted: boolean("is_muted").default(false),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  fromUser: text("from_user").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const lockedGames = pgTable("locked_games", {
  id: serial("id").primaryKey(),
  gameId: text("game_id").notNull().unique(),
  lockedBy: text("locked_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});


export const insertSiteUserSchema = createInsertSchema(siteUsers).pick({
  username: true,
  passwordHash: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  fromUser: true,
  content: true,
});

export type SiteUser = typeof siteUsers.$inferSelect;
export type InsertSiteUser = z.infer<typeof insertSiteUserSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
