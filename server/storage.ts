import { siteUsers, messages, lockedGames, type SiteUser, type Message, type InsertMessage } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  getAllUsers(): Promise<string[]>;
  registerUser(username: string): Promise<{ user: SiteUser; created: boolean }>;
  createUserWithPassword(username: string, password: string): Promise<{ user: SiteUser; created: boolean }>;
  loginUser(username: string, password: string): Promise<{ user: SiteUser; claimed: boolean } | null>;
  updateUserPassword(id: number, newPassword: string): Promise<boolean>;
  getAllSiteUsers(): Promise<SiteUser[]>;
  getSiteUserById(id: number): Promise<SiteUser | null>;
  getSiteUserByUsername(username: string): Promise<SiteUser | null>;
  updateSiteUsername(id: number, newUsername: string): Promise<SiteUser | null>;
  setSiteUserStatus(id: number, status: number): Promise<SiteUser | null>;
  setSiteUserAdmin(id: number, isAdmin: boolean): Promise<SiteUser | null>;
  getMessages(): Promise<Message[]>;
  createMessage(msg: InsertMessage): Promise<Message>;
  getLockedGames(): Promise<{ gameId: string; lockedBy: string }[]>;
  lockGame(gameId: string, lockedBy: string): Promise<void>;
  unlockGame(gameId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getAllUsers(): Promise<string[]> {
    const users = await db.select({ username: siteUsers.username }).from(siteUsers);
    return users
      .map(u => u.username)
      .filter(u => u && u !== "System" && !u.toLowerCase().startsWith("guest"))
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  }

  async registerUser(username: string): Promise<{ user: SiteUser; created: boolean }> {
    const existing = await db.select().from(siteUsers).where(eq(siteUsers.username, username)).limit(1);
    if (existing.length > 0) return { user: existing[0], created: false };
    const [created] = await db.insert(siteUsers).values({ username, status: 1 }).returning();
    return { user: created, created: true };
  }

  async createUserWithPassword(username: string, password: string): Promise<{ user: SiteUser; created: boolean }> {
    const existing = await db.select().from(siteUsers).where(eq(siteUsers.username, username)).limit(1);
    if (existing.length > 0) return { user: existing[0], created: false };
    const passwordHash = await bcrypt.hash(password, 10);
    const [created] = await db.insert(siteUsers).values({ username, passwordHash, status: 1 }).returning();
    return { user: created, created: true };
  }

  async loginUser(username: string, password: string): Promise<{ user: SiteUser; claimed: boolean } | null> {
    const [user] = await db.select().from(siteUsers).where(eq(siteUsers.username, username)).limit(1);
    if (!user) return null;
    if (!user.passwordHash) {
      const passwordHash = await bcrypt.hash(password, 10);
      const [updated] = await db.update(siteUsers).set({ passwordHash }).where(eq(siteUsers.id, user.id)).returning();
      return { user: updated, claimed: true };
    }
    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) return null;
    return { user, claimed: false };
  }

  async updateUserPassword(id: number, newPassword: string): Promise<boolean> {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const [updated] = await db.update(siteUsers).set({ passwordHash }).where(eq(siteUsers.id, id)).returning();
    return !!updated;
  }

  async getAllSiteUsers(): Promise<SiteUser[]> {
    return await db.select().from(siteUsers).orderBy(siteUsers.id);
  }

  async getSiteUserById(id: number): Promise<SiteUser | null> {
    const [user] = await db.select().from(siteUsers).where(eq(siteUsers.id, id)).limit(1);
    return user || null;
  }

  async getSiteUserByUsername(username: string): Promise<SiteUser | null> {
    const [user] = await db.select().from(siteUsers).where(eq(siteUsers.username, username)).limit(1);
    return user || null;
  }

  async updateSiteUsername(id: number, newUsername: string): Promise<SiteUser | null> {
    const [updated] = await db.update(siteUsers).set({ username: newUsername }).where(eq(siteUsers.id, id)).returning();
    return updated || null;
  }

  async setSiteUserStatus(id: number, status: number): Promise<SiteUser | null> {
    const [updated] = await db.update(siteUsers).set({ status }).where(eq(siteUsers.id, id)).returning();
    return updated || null;
  }

  async setSiteUserAdmin(id: number, isAdmin: boolean): Promise<SiteUser | null> {
    const [updated] = await db.update(siteUsers).set({ isAdmin }).where(eq(siteUsers.id, id)).returning();
    return updated || null;
  }

  async getMessages(): Promise<Message[]> {
    return await db.select().from(messages).orderBy(messages.createdAt).limit(200);
  }

  async createMessage(msg: InsertMessage): Promise<Message> {
    const [created] = await db.insert(messages).values(msg).returning();
    return created;
  }

  async getLockedGames(): Promise<{ gameId: string; lockedBy: string }[]> {
    return await db.select({ gameId: lockedGames.gameId, lockedBy: lockedGames.lockedBy }).from(lockedGames);
  }

  async lockGame(gameId: string, lockedBy: string): Promise<void> {
    await db.insert(lockedGames).values({ gameId, lockedBy }).onConflictDoNothing();
  }

  async unlockGame(gameId: string): Promise<boolean> {
    const result = await db.delete(lockedGames).where(eq(lockedGames.gameId, gameId)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
