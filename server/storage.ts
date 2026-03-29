import { messages, directMessages, siteUsers, dmConversationHidden, gameSaves, type Message, type InsertMessage, type DirectMessage, type InsertDirectMessage, type SiteUser } from "@shared/schema";
import { db } from "./db";
import { desc, eq, or, and, gt, isNull, lt } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  getMessages(): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  getDirectMessages(user1: string, user2: string): Promise<DirectMessage[]>;
  createDirectMessage(dm: InsertDirectMessage): Promise<DirectMessage>;
  getConversations(username: string): Promise<string[]>;
  getLatestDmFor(username: string): Promise<DirectMessage | null>;
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
  setSiteUserMuted(id: number, muted: boolean): Promise<SiteUser | null>;
  setSiteUserAdmin(id: number, isAdmin: boolean): Promise<SiteUser | null>;
  markConversationRead(currentUser: string, otherUser: string): Promise<void>;
  getUnreadCounts(username: string): Promise<Record<string, number>>;
  hideConversation(username: string, otherUser: string): Promise<void>;
  getGameSave(userId: number): Promise<unknown | null>;
  upsertGameSave(userId: number, saveData: unknown): Promise<void>;
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
    const hiddenForUser1 = await db
      .select({ hiddenBefore: dmConversationHidden.hiddenBefore })
      .from(dmConversationHidden)
      .where(and(eq(dmConversationHidden.username, user1), eq(dmConversationHidden.otherUser, user2)))
      .limit(1);
    const hiddenForUser2 = await db
      .select({ hiddenBefore: dmConversationHidden.hiddenBefore })
      .from(dmConversationHidden)
      .where(and(eq(dmConversationHidden.username, user2), eq(dmConversationHidden.otherUser, user1)))
      .limit(1);

    const cutoff1 = hiddenForUser1[0]?.hiddenBefore ?? null;
    const cutoff2 = hiddenForUser2[0]?.hiddenBefore ?? null;

    const allMsgs = await db
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

    return allMsgs.filter(msg => {
      const msgTime = msg.createdAt ? new Date(msg.createdAt) : new Date(0);
      if (cutoff1 && msgTime <= cutoff1) return false;
      if (cutoff2 && msgTime <= cutoff2) return false;
      return true;
    });
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
      .select({ user: directMessages.toUser, createdAt: directMessages.createdAt })
      .from(directMessages)
      .where(eq(directMessages.fromUser, username))
      .orderBy(desc(directMessages.createdAt));
    const received = await db
      .select({ user: directMessages.fromUser, createdAt: directMessages.createdAt })
      .from(directMessages)
      .where(eq(directMessages.toUser, username))
      .orderBy(desc(directMessages.createdAt));

    const hiddenRows = await db
      .select()
      .from(dmConversationHidden)
      .where(eq(dmConversationHidden.username, username));

    const hiddenMap = new Map<string, Date>();
    for (const row of hiddenRows) {
      if (row.hiddenBefore) hiddenMap.set(row.otherUser, row.hiddenBefore);
    }

    const latestByUser = new Map<string, Date>();
    for (const row of [...sent, ...received]) {
      const user = row.user;
      const time = row.createdAt ? new Date(row.createdAt) : new Date(0);
      const existing = latestByUser.get(user);
      if (!existing || time > existing) {
        latestByUser.set(user, time);
      }
    }

    const users: string[] = [];
    for (const [user, latestTime] of latestByUser.entries()) {
      const hiddenBefore = hiddenMap.get(user);
      if (hiddenBefore && latestTime <= hiddenBefore) continue;
      users.push(user);
    }

    users.sort((a, b) => {
      const ta = latestByUser.get(a) ?? new Date(0);
      const tb = latestByUser.get(b) ?? new Date(0);
      return tb.getTime() - ta.getTime();
    });

    return users;
  }

  async markConversationRead(currentUser: string, otherUser: string): Promise<void> {
    await db
      .update(directMessages)
      .set({ isRead: true, readAt: new Date() })
      .where(
        and(
          eq(directMessages.fromUser, otherUser),
          eq(directMessages.toUser, currentUser),
          or(eq(directMessages.isRead, false), isNull(directMessages.isRead))
        )
      );
  }

  async getUnreadCounts(username: string): Promise<Record<string, number>> {
    const unread = await db
      .select({ fromUser: directMessages.fromUser })
      .from(directMessages)
      .where(
        and(
          eq(directMessages.toUser, username),
          eq(directMessages.isRead, false)
        )
      );

    const hiddenRows = await db
      .select()
      .from(dmConversationHidden)
      .where(eq(dmConversationHidden.username, username));

    const hiddenMap = new Map<string, Date>();
    for (const row of hiddenRows) {
      if (row.hiddenBefore) hiddenMap.set(row.otherUser, row.hiddenBefore);
    }

    const counts: Record<string, number> = {};
    for (const row of unread) {
      const sender = row.fromUser;
      const hidden = hiddenMap.get(sender);
      if (hidden) continue;
      counts[sender] = (counts[sender] ?? 0) + 1;
    }
    return counts;
  }

  async hideConversation(username: string, otherUser: string): Promise<void> {
    const existing = await db
      .select()
      .from(dmConversationHidden)
      .where(and(eq(dmConversationHidden.username, username), eq(dmConversationHidden.otherUser, otherUser)))
      .limit(1);

    const now = new Date();
    if (existing.length > 0) {
      await db
        .update(dmConversationHidden)
        .set({ hiddenBefore: now })
        .where(and(eq(dmConversationHidden.username, username), eq(dmConversationHidden.otherUser, otherUser)));
    } else {
      await db
        .insert(dmConversationHidden)
        .values({ username, otherUser, hiddenBefore: now });
    }
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

  async createUserWithPassword(username: string, password: string): Promise<{ user: SiteUser; created: boolean }> {
    const existing = await db
      .select()
      .from(siteUsers)
      .where(eq(siteUsers.username, username))
      .limit(1);
    if (existing.length > 0) return { user: existing[0], created: false };
    const passwordHash = await bcrypt.hash(password, 10);
    const [created] = await db
      .insert(siteUsers)
      .values({ username, passwordHash, status: 1 })
      .returning();
    return { user: created, created: true };
  }

  async loginUser(username: string, password: string): Promise<{ user: SiteUser; claimed: boolean } | null> {
    const [user] = await db
      .select()
      .from(siteUsers)
      .where(eq(siteUsers.username, username))
      .limit(1);
    if (!user) return null;
    if (!user.passwordHash) {
      // Legacy user with no password — claim the account by setting this password
      const passwordHash = await bcrypt.hash(password, 10);
      const [updated] = await db
        .update(siteUsers)
        .set({ passwordHash })
        .where(eq(siteUsers.id, user.id))
        .returning();
      return { user: updated, claimed: true };
    }
    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) return null;
    return { user, claimed: false };
  }

  async updateUserPassword(id: number, newPassword: string): Promise<boolean> {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const [updated] = await db
      .update(siteUsers)
      .set({ passwordHash })
      .where(eq(siteUsers.id, id))
      .returning();
    return !!updated;
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

  async getSiteUserByUsername(username: string): Promise<SiteUser | null> {
    const [user] = await db
      .select()
      .from(siteUsers)
      .where(eq(siteUsers.username, username))
      .limit(1);
    return user || null;
  }

  async setSiteUserMuted(id: number, muted: boolean): Promise<SiteUser | null> {
    const [updated] = await db
      .update(siteUsers)
      .set({ isMuted: muted })
      .where(eq(siteUsers.id, id))
      .returning();
    return updated || null;
  }

  async setSiteUserAdmin(id: number, isAdmin: boolean): Promise<SiteUser | null> {
    const [updated] = await db
      .update(siteUsers)
      .set({ isAdmin })
      .where(eq(siteUsers.id, id))
      .returning();
    return updated || null;
  }

  async getGameSave(userId: number): Promise<unknown | null> {
    const [row] = await db
      .select()
      .from(gameSaves)
      .where(eq(gameSaves.userId, userId))
      .limit(1);
    return row ? row.saveData : null;
  }

  async upsertGameSave(userId: number, saveData: unknown): Promise<void> {
    const existing = await db
      .select({ id: gameSaves.id })
      .from(gameSaves)
      .where(eq(gameSaves.userId, userId))
      .limit(1);

    const now = new Date();
    if (existing.length > 0) {
      await db
        .update(gameSaves)
        .set({ saveData: saveData as Record<string, unknown>, updatedAt: now })
        .where(eq(gameSaves.userId, userId));
    } else {
      await db
        .insert(gameSaves)
        .values({ userId, saveData: saveData as Record<string, unknown>, updatedAt: now });
    }
  }
}

export const storage = new DatabaseStorage();
