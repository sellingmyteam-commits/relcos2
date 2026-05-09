import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

function safeUser(user: Record<string, unknown>) {
  const { passwordHash: _ph, ...safe } = user;
  return safe;
}

const BAD_WORDS = [
  "fuck", "fuk", "fck", "fucc", "phuck", "f.ck",
  "shit", "sh1t",
  "cunt",
  "bitch", "b1tch",
  "asshole", "arsehole",
  "bastard",
  "dick", "d1ck",
  "cock",
  "pussy",
  "piss",
  "fag",
  "slut",
  "whore",
  "twat",
  "wank",
  "bollocks",
  "arse",
  "ass",
  "nigger", "nigga",
  "faggot",
  "kike",
  "spic",
  "chink",
  "retard",
];

const FILTER_REGEX = new RegExp(
  `\\b(${BAD_WORDS.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`,
  "gi"
);

function filterContent(text: string): string {
  return text.replace(FILTER_REGEX, (match) =>
    match[0] + "*".repeat(match.length - 1)
  );
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/users", async (req, res) => {
    const users = await storage.getAllUsers();
    res.json(users);
  });

  app.post("/api/user/register", async (req, res) => {
    try {
      const { username } = z.object({ username: z.string().min(1).max(20) }).parse(req.body);
      const { user, created } = await storage.registerUser(username);
      res.status(created ? 201 : 200).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password } = z.object({
        username: z.string().min(2).max(20).regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, underscores only"),
        password: z.string().min(4).max(100),
      }).parse(req.body);
      const { user, created } = await storage.createUserWithPassword(username, password);
      if (!created) return res.status(409).json({ message: "Username already taken" });
      res.status(201).json({ id: user.id, username: user.username });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = z.object({
        username: z.string().min(1).max(20),
        password: z.string().min(1).max(100),
      }).parse(req.body);
      const result = await storage.loginUser(username, password);
      if (!result) return res.status(401).json({ message: "Wrong username or password" });
      res.json({ id: result.user.id, username: result.user.username, claimed: result.claimed });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.post("/api/auth/change-username", async (req, res) => {
    try {
      const { userId, newUsername } = z.object({
        userId: z.number().int().positive(),
        newUsername: z.string().min(2).max(20).regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, underscores only"),
      }).parse(req.body);
      const existing = await storage.getSiteUserByUsername(newUsername);
      if (existing && existing.id !== userId) return res.status(409).json({ message: "Username already taken" });
      const updated = await storage.updateSiteUsername(userId, newUsername);
      if (!updated) return res.status(404).json({ message: "User not found" });
      res.json({ id: updated.id, username: updated.username });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.post("/api/auth/change-password", async (req, res) => {
    try {
      const { userId, currentPassword, newPassword } = z.object({
        userId: z.number().int().positive(),
        currentPassword: z.string().min(1).max(100),
        newPassword: z.string().min(4).max(100),
      }).parse(req.body);
      const user = await storage.getSiteUserById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      if (user.passwordHash) {
        const bcrypt = await import("bcryptjs");
        const matches = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!matches) return res.status(401).json({ message: "Current password is incorrect" });
      }
      await storage.updateUserPassword(userId, newPassword);
      res.json({ ok: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.get("/api/user/status/id/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    const user = await storage.getSiteUserById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(safeUser(user as unknown as Record<string, unknown>));
  });

  app.get("/api/admin/users", async (req, res) => {
    const users = await storage.getAllSiteUsers();
    res.json(users.map(u => safeUser(u as unknown as Record<string, unknown>)));
  });

  app.patch("/api/admin/users/:id/username", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { username } = z.object({ username: z.string().min(1).max(20) }).parse(req.body);
      const updated = await storage.updateSiteUsername(id, username);
      if (!updated) return res.status(404).json({ message: "User not found" });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.patch("/api/admin/users/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { status } = z.object({ status: z.number().int().min(0).max(1) }).parse(req.body);
      const updated = await storage.setSiteUserStatus(id, status);
      if (!updated) return res.status(404).json({ message: "User not found" });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.patch("/api/admin/users/:id/mute", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { muted } = z.object({ muted: z.boolean() }).parse(req.body);
      const updated = await storage.setSiteUserMuted(id, muted);
      if (!updated) return res.status(404).json({ message: "User not found" });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.patch("/api/admin/users/:id/admin", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { isAdmin } = z.object({ isAdmin: z.boolean() }).parse(req.body);
      const updated = await storage.setSiteUserAdmin(id, isAdmin);
      if (!updated) return res.status(404).json({ message: "User not found" });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // ── Group chats ──
  app.post("/api/groups", async (req, res) => {
    try {
      const { name, createdBy, members } = z.object({
        name: z.string().min(1).max(40),
        createdBy: z.string().min(1).max(20),
        members: z.array(z.string().min(1).max(20)).min(1).max(50),
      }).parse(req.body);
      const group = await storage.createGroup(name, createdBy, members);
      const full = await storage.getGroupById(group.id);
      res.status(201).json(full);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.get("/api/groups/user/:username", async (req, res) => {
    const groups = await storage.getGroupsForUser(req.params.username);
    res.json(groups);
  });

  app.get("/api/groups/latest/:username", async (req, res) => {
    const latest = await storage.getLatestGroupMessageForUser(req.params.username);
    res.json(latest);
  });

  app.get("/api/groups/:groupId", async (req, res) => {
    const groupId = parseInt(req.params.groupId, 10);
    if (isNaN(groupId)) return res.status(400).json({ message: "Invalid groupId" });
    const group = await storage.getGroupById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    res.json(group);
  });

  app.get("/api/groups/:groupId/messages", async (req, res) => {
    const groupId = parseInt(req.params.groupId, 10);
    if (isNaN(groupId)) return res.status(400).json({ message: "Invalid groupId" });
    const username = String(req.query.username || "");
    if (!username) return res.status(400).json({ message: "username required" });
    const member = await storage.isGroupMember(groupId, username);
    if (!member) return res.status(403).json({ message: "Not a member of this group" });
    const msgs = await storage.getGroupMessages(groupId);
    res.json(msgs);
  });

  app.post("/api/groups/:groupId/messages", async (req, res) => {
    try {
      const groupId = parseInt(req.params.groupId, 10);
      if (isNaN(groupId)) return res.status(400).json({ message: "Invalid groupId" });
      const { fromUser, content } = z.object({
        fromUser: z.string().min(1).max(20),
        content: z.string().min(1).max(2000),
      }).parse(req.body);
      const member = await storage.isGroupMember(groupId, fromUser);
      if (!member) return res.status(403).json({ message: "Not a member of this group" });
      const siteUser = await storage.getSiteUserByUsername(fromUser);
      if (siteUser && siteUser.isMuted) {
        return res.status(403).json({ message: "You are muted." });
      }
      const filtered = filterContent(content);
      if (!filtered.trim()) return res.status(400).json({ message: "Message blocked by chat filter" });
      const msg = await storage.createGroupMessage({ groupId, fromUser, content: filtered });
      res.status(201).json(msg);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.post("/api/groups/:groupId/members", async (req, res) => {
    try {
      const groupId = parseInt(req.params.groupId, 10);
      if (isNaN(groupId)) return res.status(400).json({ message: "Invalid groupId" });
      const { username, addedBy } = z.object({
        username: z.string().min(1).max(20),
        addedBy: z.string().min(1).max(20),
      }).parse(req.body);
      const isMember = await storage.isGroupMember(groupId, addedBy);
      if (!isMember) return res.status(403).json({ message: "Only members can add others" });
      await storage.addGroupMember(groupId, username);
      const full = await storage.getGroupById(groupId);
      res.json(full);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.post("/api/groups/:groupId/invite", async (req, res) => {
    try {
      const groupId = parseInt(req.params.groupId, 10);
      if (isNaN(groupId)) return res.status(400).json({ message: "Invalid groupId" });
      const { usernames, invitedBy } = z.object({
        usernames: z.array(z.string().min(1).max(20)).min(1).max(50),
        invitedBy: z.string().min(1).max(20),
      }).parse(req.body);
      const isMember = await storage.isGroupMember(groupId, invitedBy);
      if (!isMember) return res.status(403).json({ message: "Only members can invite others" });
      for (const username of usernames) {
        await storage.sendGroupInvite(groupId, username, invitedBy);
      }
      res.json({ ok: true, invited: usernames.length });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/groups/:groupId/members/:username", async (req, res) => {
    const groupId = parseInt(req.params.groupId, 10);
    if (isNaN(groupId)) return res.status(400).json({ message: "Invalid groupId" });
    await storage.leaveGroup(groupId, req.params.username);
    res.json({ ok: true });
  });

  // ── Group invites ──
  app.get("/api/groups/invites/:username", async (req, res) => {
    const invites = await storage.getPendingInvitesForUser(req.params.username);
    res.json(invites);
  });

  app.post("/api/groups/invites/:inviteId/accept", async (req, res) => {
    try {
      const inviteId = parseInt(req.params.inviteId, 10);
      if (isNaN(inviteId)) return res.status(400).json({ message: "Invalid inviteId" });
      const { username } = z.object({ username: z.string().min(1).max(20) }).parse(req.body);
      const result = await storage.acceptGroupInvite(inviteId, username);
      if (!result) return res.status(404).json({ message: "Invite not found" });
      res.json({ ok: true, groupId: result.groupId });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/groups/invites/:inviteId/decline", async (req, res) => {
    try {
      const inviteId = parseInt(req.params.inviteId, 10);
      if (isNaN(inviteId)) return res.status(400).json({ message: "Invalid inviteId" });
      const { username } = z.object({ username: z.string().min(1).max(20) }).parse(req.body);
      const ok = await storage.declineGroupInvite(inviteId, username);
      if (!ok) return res.status(404).json({ message: "Invite not found" });
      res.json({ ok: true });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ── Admin warnings ──
  app.post("/api/admin/users/:id/warn", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid id" });
      const { message, fromAdmin } = z.object({
        message: z.string().min(1).max(500),
        fromAdmin: z.string().min(1).max(20),
      }).parse(req.body);
      const target = await storage.getSiteUserById(id);
      if (!target) return res.status(404).json({ message: "User not found" });
      await storage.createWarning(id, message, fromAdmin);
      res.json({ ok: true });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/user/warnings/:userId", async (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) return res.status(400).json({ message: "Invalid userId" });
    const warnings = await storage.getActiveWarningsForUser(userId);
    res.json(warnings);
  });

  app.post("/api/user/warnings/:warningId/ack", async (req, res) => {
    try {
      const warningId = parseInt(req.params.warningId, 10);
      if (isNaN(warningId)) return res.status(400).json({ message: "Invalid warningId" });
      const { userId } = z.object({ userId: z.number().int().positive() }).parse(req.body);
      const ok = await storage.acknowledgeWarning(warningId, userId);
      if (!ok) return res.status(404).json({ message: "Warning not found" });
      res.json({ ok: true });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ── Game locks ──
  app.get("/api/locked-games", async (_req, res) => {
    const list = await storage.getLockedGames();
    res.json(list);
  });

  app.post("/api/admin/games/lock", async (req, res) => {
    try {
      const { gameId, lockedBy } = z.object({
        gameId: z.string().min(1).max(100),
        lockedBy: z.string().min(1).max(20),
      }).parse(req.body);
      await storage.lockGame(gameId, lockedBy);
      res.json({ ok: true });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/admin/games/lock/:gameId", async (req, res) => {
    const ok = await storage.unlockGame(req.params.gameId);
    if (!ok) return res.status(404).json({ message: "Not locked" });
    res.json({ ok: true });
  });

  app.get("/api/saves/:userId", async (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) return res.status(400).json({ message: "Invalid userId" });
    try {
      const saveData = await storage.getGameSave(userId);
      res.json({ saveData: saveData ?? null });
    } catch {
      res.status(500).json({ message: "Failed to load save" });
    }
  });

  app.post("/api/saves/:userId", async (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) return res.status(400).json({ message: "Invalid userId" });
    const { saveData } = req.body;
    if (saveData === undefined) return res.status(400).json({ message: "saveData is required" });
    try {
      await storage.upsertGameSave(userId, saveData);
      res.json({ ok: true });
    } catch {
      res.status(500).json({ message: "Failed to save" });
    }
  });

  return httpServer;
}
