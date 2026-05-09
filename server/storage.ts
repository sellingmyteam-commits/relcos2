import { siteUsers, gameSaves, chatGroups, chatGroupMembers, groupMessages, groupInvites, userWarnings, lockedGames, type SiteUser, type ChatGroup, type GroupMessage, type InsertGroupMessage } from "@shared/schema";
import { db } from "./db";
import { desc, eq, and, inArray } from "drizzle-orm";
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
  setSiteUserMuted(id: number, muted: boolean): Promise<SiteUser | null>;
  setSiteUserAdmin(id: number, isAdmin: boolean): Promise<SiteUser | null>;
  getGameSave(userId: number): Promise<unknown | null>;
  upsertGameSave(userId: number, saveData: unknown): Promise<void>;
  createGroup(name: string, createdBy: string, invitees: string[]): Promise<ChatGroup>;
  getGroupsForUser(username: string): Promise<(ChatGroup & { members: string[] })[]>;
  getGroupById(groupId: number): Promise<(ChatGroup & { members: string[] }) | null>;
  isGroupMember(groupId: number, username: string): Promise<boolean>;
  getGroupMessages(groupId: number): Promise<GroupMessage[]>;
  getLatestGroupMessageForUser(username: string): Promise<(GroupMessage & { groupName: string }) | null>;
  createGroupMessage(msg: InsertGroupMessage): Promise<GroupMessage>;
  addGroupMember(groupId: number, username: string): Promise<void>;
  leaveGroup(groupId: number, username: string): Promise<void>;
  getPendingInvitesForUser(username: string): Promise<{ id: number; groupId: number; groupName: string; invitedBy: string; createdAt: Date | null }[]>;
  acceptGroupInvite(inviteId: number, username: string): Promise<{ groupId: number } | null>;
  declineGroupInvite(inviteId: number, username: string): Promise<boolean>;
  createWarning(userId: number, message: string, fromAdmin: string): Promise<void>;
  getActiveWarningsForUser(userId: number): Promise<{ id: number; message: string; fromAdmin: string; createdAt: Date | null }[]>;
  acknowledgeWarning(warningId: number, userId: number): Promise<boolean>;
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

  async setSiteUserMuted(id: number, muted: boolean): Promise<SiteUser | null> {
    const [updated] = await db.update(siteUsers).set({ isMuted: muted }).where(eq(siteUsers.id, id)).returning();
    return updated || null;
  }

  async setSiteUserAdmin(id: number, isAdmin: boolean): Promise<SiteUser | null> {
    const [updated] = await db.update(siteUsers).set({ isAdmin }).where(eq(siteUsers.id, id)).returning();
    return updated || null;
  }

  async getGameSave(userId: number): Promise<unknown | null> {
    const [row] = await db.select().from(gameSaves).where(eq(gameSaves.userId, userId)).limit(1);
    return row ? row.saveData : null;
  }

  async upsertGameSave(userId: number, saveData: unknown): Promise<void> {
    const existing = await db.select({ id: gameSaves.id }).from(gameSaves).where(eq(gameSaves.userId, userId)).limit(1);
    const now = new Date();
    if (existing.length > 0) {
      await db.update(gameSaves).set({ saveData: saveData as Record<string, unknown>, updatedAt: now }).where(eq(gameSaves.userId, userId));
    } else {
      await db.insert(gameSaves).values({ userId, saveData: saveData as Record<string, unknown>, updatedAt: now });
    }
  }

  async createGroup(name: string, createdBy: string, invitees: string[]): Promise<ChatGroup> {
    const [group] = await db.insert(chatGroups).values({ name, createdBy }).returning();
    await db.insert(chatGroupMembers).values({ groupId: group.id, username: createdBy });
    const uniqueInvitees = Array.from(new Set(invitees.filter(u => u && u !== createdBy)));
    if (uniqueInvitees.length > 0) {
      await db.insert(groupInvites).values(
        uniqueInvitees.map(username => ({ groupId: group.id, username, invitedBy: createdBy }))
      );
    }
    return group;
  }

  async getPendingInvitesForUser(username: string): Promise<{ id: number; groupId: number; groupName: string; invitedBy: string; createdAt: Date | null }[]> {
    const invites = await db.select().from(groupInvites).where(eq(groupInvites.username, username)).orderBy(desc(groupInvites.createdAt));
    if (invites.length === 0) return [];
    const groupIds = invites.map(i => i.groupId);
    const groups = await db.select({ id: chatGroups.id, name: chatGroups.name }).from(chatGroups).where(inArray(chatGroups.id, groupIds));
    const nameMap = new Map(groups.map(g => [g.id, g.name]));
    return invites.map(i => ({
      id: i.id,
      groupId: i.groupId,
      groupName: nameMap.get(i.groupId) ?? "Group",
      invitedBy: i.invitedBy,
      createdAt: i.createdAt,
    }));
  }

  async acceptGroupInvite(inviteId: number, username: string): Promise<{ groupId: number } | null> {
    const [invite] = await db.select().from(groupInvites).where(and(eq(groupInvites.id, inviteId), eq(groupInvites.username, username))).limit(1);
    if (!invite) return null;
    await this.addGroupMember(invite.groupId, username);
    await db.delete(groupInvites).where(eq(groupInvites.id, inviteId));
    return { groupId: invite.groupId };
  }

  async declineGroupInvite(inviteId: number, username: string): Promise<boolean> {
    const result = await db.delete(groupInvites).where(and(eq(groupInvites.id, inviteId), eq(groupInvites.username, username))).returning();
    return result.length > 0;
  }

  async createWarning(userId: number, message: string, fromAdmin: string): Promise<void> {
    await db.insert(userWarnings).values({ userId, message, fromAdmin });
  }

  async getActiveWarningsForUser(userId: number): Promise<{ id: number; message: string; fromAdmin: string; createdAt: Date | null }[]> {
    return await db
      .select({ id: userWarnings.id, message: userWarnings.message, fromAdmin: userWarnings.fromAdmin, createdAt: userWarnings.createdAt })
      .from(userWarnings)
      .where(and(eq(userWarnings.userId, userId), eq(userWarnings.acknowledged, false)))
      .orderBy(userWarnings.createdAt);
  }

  async acknowledgeWarning(warningId: number, userId: number): Promise<boolean> {
    const result = await db.update(userWarnings).set({ acknowledged: true }).where(and(eq(userWarnings.id, warningId), eq(userWarnings.userId, userId))).returning();
    return result.length > 0;
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

  async getGroupsForUser(username: string): Promise<(ChatGroup & { members: string[] })[]> {
    const memberships = await db.select({ groupId: chatGroupMembers.groupId }).from(chatGroupMembers).where(eq(chatGroupMembers.username, username));
    const groupIds = memberships.map(m => m.groupId);
    if (groupIds.length === 0) return [];
    const groups = await db.select().from(chatGroups).where(inArray(chatGroups.id, groupIds)).orderBy(desc(chatGroups.createdAt));
    const allMembers = await db.select().from(chatGroupMembers).where(inArray(chatGroupMembers.groupId, groupIds));
    return groups.map(g => ({
      ...g,
      members: allMembers.filter(m => m.groupId === g.id).map(m => m.username),
    }));
  }

  async getGroupById(groupId: number): Promise<(ChatGroup & { members: string[] }) | null> {
    const [group] = await db.select().from(chatGroups).where(eq(chatGroups.id, groupId)).limit(1);
    if (!group) return null;
    const members = await db.select({ username: chatGroupMembers.username }).from(chatGroupMembers).where(eq(chatGroupMembers.groupId, groupId));
    return { ...group, members: members.map(m => m.username) };
  }

  async isGroupMember(groupId: number, username: string): Promise<boolean> {
    const [row] = await db.select().from(chatGroupMembers).where(and(eq(chatGroupMembers.groupId, groupId), eq(chatGroupMembers.username, username))).limit(1);
    return !!row;
  }

  async getGroupMessages(groupId: number): Promise<GroupMessage[]> {
    return await db.select().from(groupMessages).where(eq(groupMessages.groupId, groupId)).orderBy(groupMessages.createdAt).limit(200);
  }

  async createGroupMessage(msg: InsertGroupMessage): Promise<GroupMessage> {
    const [created] = await db.insert(groupMessages).values(msg).returning();
    return created;
  }

  async getLatestGroupMessageForUser(username: string): Promise<(GroupMessage & { groupName: string }) | null> {
    const memberships = await db.select({ groupId: chatGroupMembers.groupId }).from(chatGroupMembers).where(eq(chatGroupMembers.username, username));
    const groupIds = memberships.map(m => m.groupId);
    if (groupIds.length === 0) return null;
    const [latest] = await db.select().from(groupMessages).where(inArray(groupMessages.groupId, groupIds)).orderBy(desc(groupMessages.createdAt)).limit(1);
    if (!latest) return null;
    const [group] = await db.select({ name: chatGroups.name }).from(chatGroups).where(eq(chatGroups.id, latest.groupId)).limit(1);
    return { ...latest, groupName: group?.name ?? "Group" };
  }

  async addGroupMember(groupId: number, username: string): Promise<void> {
    const exists = await this.isGroupMember(groupId, username);
    if (exists) return;
    await db.insert(chatGroupMembers).values({ groupId, username });
  }

  async leaveGroup(groupId: number, username: string): Promise<void> {
    await db.delete(chatGroupMembers).where(and(eq(chatGroupMembers.groupId, groupId), eq(chatGroupMembers.username, username)));
  }
}

export const storage = new DatabaseStorage();
