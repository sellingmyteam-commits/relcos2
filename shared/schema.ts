import { pgTable, text, serial, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
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

export const gameSaves = pgTable("game_saves", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => siteUsers.id),
  saveData: jsonb("save_data").notNull().default({}),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chatGroups = pgTable("chat_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatGroupMembers = pgTable("chat_group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => chatGroups.id, { onDelete: "cascade" }),
  username: text("username").notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const groupMessages = pgTable("group_messages", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => chatGroups.id, { onDelete: "cascade" }),
  fromUser: text("from_user").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const groupInvites = pgTable("group_invites", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => chatGroups.id, { onDelete: "cascade" }),
  username: text("username").notNull(),
  invitedBy: text("invited_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const lockedGames = pgTable("locked_games", {
  id: serial("id").primaryKey(),
  gameId: text("game_id").notNull().unique(),
  lockedBy: text("locked_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userWarnings = pgTable("user_warnings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => siteUsers.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  fromAdmin: text("from_admin").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  acknowledged: boolean("acknowledged").default(false),
});

export const insertSiteUserSchema = createInsertSchema(siteUsers).pick({
  username: true,
  passwordHash: true,
});

export const insertChatGroupSchema = createInsertSchema(chatGroups).pick({
  name: true,
  createdBy: true,
});
export const insertGroupMessageSchema = createInsertSchema(groupMessages).pick({
  groupId: true,
  fromUser: true,
  content: true,
});

export type SiteUser = typeof siteUsers.$inferSelect;
export type InsertSiteUser = z.infer<typeof insertSiteUserSchema>;
export type GameSave = typeof gameSaves.$inferSelect;
export type ChatGroup = typeof chatGroups.$inferSelect;
export type ChatGroupMember = typeof chatGroupMembers.$inferSelect;
export type GroupMessage = typeof groupMessages.$inferSelect;
export type InsertChatGroup = z.infer<typeof insertChatGroupSchema>;
export type InsertGroupMessage = z.infer<typeof insertGroupMessageSchema>;
