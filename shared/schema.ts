import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const directMessages = pgTable("direct_messages", {
  id: serial("id").primaryKey(),
  fromUser: text("from_user").notNull(),
  toUser: text("to_user").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const siteUsers = pgTable("site_users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  status: integer("status").notNull().default(1),
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  username: true,
  content: true,
});

export const insertDirectMessageSchema = createInsertSchema(directMessages).pick({
  fromUser: true,
  toUser: true,
  content: true,
});

export const insertSiteUserSchema = createInsertSchema(siteUsers).pick({
  username: true,
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type DirectMessage = typeof directMessages.$inferSelect;
export type InsertDirectMessage = z.infer<typeof insertDirectMessageSchema>;
export type SiteUser = typeof siteUsers.$inferSelect;
export type InsertSiteUser = z.infer<typeof insertSiteUserSchema>;
