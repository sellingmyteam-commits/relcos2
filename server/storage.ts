import { messages, directMessages, siteUsers, type Message, type InsertMessage, type DirectMessage, type InsertDirectMessage, type SiteUser } from "@shared/schema";
import { db } from "./db";
import { desc, eq, or, and } from "drizzle-orm";

export interface IStorage {
  getMessages(): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  getDirectMessages(user1: string, user2: string): Promise<DirectMessage[]>;
  createDirectMessage(dm: InsertDirectMessage): Promise<DirectMessage>;
  getConversations(username: string): Promise<string[]>;
  getLatestDmFor(username: string): Promise<DirectMessage | null>;
  getAllUsers(): Promise<string[]>;
  registerUser(username: string): Promise<{ user: SiteUser; created: boolean }>;
  getAllSiteUsers(): Promise<SiteUser[]>;
  getSiteUserById(id: number): Promise<SiteUser | null>;
  updateSiteUsername(id: number, newUsername: string): Promise<SiteUser | null>;
  setSiteUserStatus(id: number, status: number): Promise<SiteUser | null>;
}

export class DatabaseStorage implements IStorage {
  async getAllUsers(): Promise<string[]> {
    const globalUsers = await db
      .select({ username: messages.username })
      .from(messages);
    const dmFromUsers = await db
      .select({ username: directMessages.fromUser })
      .from(directMessages);
    const dmToUsers = await db
      .select({ username: directMessages.toUser })
      .from(directMessages);

    const allUsers = new Set([
      ...globalUsers.map(u => u.username),
      ...dmFromUsers.map(u => u.username),
      ...dmToUsers.map(u => u.username)
    ]);

    return Array.from(allUsers).filter(u => u && u !== "System" && !u.toLowerCase().startsWith("guest"));
  }

  async getMessages(): Promise<Message[]> {
    return await db.select().from(messages).orderBy(desc(messages.createdAt)).limit(50);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async getDirectMessages(user1: string, user2: string): Promise<DirectMessage[]> {
    return await db
      .select()
      .from(directMessages)
      .where(
        or(
          and(eq(directMessages.fromUser, user1), eq(directMessages.toUser, user2)),
          and(eq(directMessages.fromUser, user2), eq(directMessages.toUser, user1))
        )
      )
      .orderBy(directMessages.createdAt)
      .limit(100);
  }

  async createDirectMessage(dm: InsertDirectMessage): Promise<DirectMessage> {
    const [message] = await db
      .insert(directMessages)
      .values(dm)
      .returning();
    return message;
  }

  async getLatestDmFor(username: string): Promise<DirectMessage | null> {
    const [latest] = await db
      .select()
      .from(directMessages)
      .where(eq(directMessages.toUser, username))
      .orderBy(desc(directMessages.createdAt))
      .limit(1);
    return latest || null;
  }

  async getConversations(username: string): Promise<string[]> {
    const sent = await db
      .select({ user: directMessages.toUser })
      .from(directMessages)
      .where(eq(directMessages.fromUser, username));
    const received = await db
      .select({ user: directMessages.fromUser })
      .from(directMessages)
      .where(eq(directMessages.toUser, username));
    const users = new Set([...sent.map(r => r.user), ...received.map(r => r.user)]);
    return Array.from(users);
  }

  async registerUser(username: string): Promise<{ user: SiteUser; created: boolean }> {
    const existing = await db
      .select()
      .from(siteUsers)
      .where(eq(siteUsers.username, username))
      .limit(1);
    if (existing.length > 0) return { user: existing[0], created: false };
    const [created] = await db
      .insert(siteUsers)
      .values({ username, status: 1 })
      .returning();
    return { user: created, created: true };
  }

  async getAllSiteUsers(): Promise<SiteUser[]> {
    return await db.select().from(siteUsers).orderBy(siteUsers.id);
  }

  async getSiteUserById(id: number): Promise<SiteUser | null> {
    const [user] = await db
      .select()
      .from(siteUsers)
      .where(eq(siteUsers.id, id))
      .limit(1);
    return user || null;
  }

  async updateSiteUsername(id: number, newUsername: string): Promise<SiteUser | null> {
    const [updated] = await db
      .update(siteUsers)
      .set({ username: newUsername })
      .where(eq(siteUsers.id, id))
      .returning();
    return updated || null;
  }

  async setSiteUserStatus(id: number, status: number): Promise<SiteUser | null> {
    const [updated] = await db
      .update(siteUsers)
      .set({ status })
      .where(eq(siteUsers.id, id))
      .returning();
    return updated || null;
  }
}

export const storage = new DatabaseStorage();
