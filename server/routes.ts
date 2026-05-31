import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
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

// ── Messages cache ──
let messagesCache: { data: unknown[]; ts: number } | null = null;
const MESSAGES_TTL = 8000; // 8 s — slightly under the 10 s client poll interval

function invalidateMessagesCache() {
  messagesCache = null;
}

// ── Locked games cache ──
let lockedGamesCache: { data: unknown[]; ts: number } | null = null;
const LOCKED_GAMES_TTL = 120000; // 2 min — client polls every 3 min

function invalidateLockedGamesCache() {
  lockedGamesCache = null;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ── Global chat messages ──
  app.get("/api/messages", async (_req, res) => {
    try {
      const now = Date.now();
      if (messagesCache && now - messagesCache.ts < MESSAGES_TTL) {
        return res.json(messagesCache.data);
      }
      const msgs = await storage.getMessages();
      messagesCache = { data: msgs, ts: now };
      res.json(msgs);
    } catch (err) {
      console.error("messages get error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const { fromUser, content } = z.object({
        fromUser: z.string().min(1).max(20),
        content: z.string().min(1).max(2000),
      }).parse(req.body);
      const filtered = filterContent(content);
      if (!filtered.trim()) return res.status(400).json({ message: "Message blocked by chat filter" });
      const msg = await storage.createMessage({ fromUser, content: filtered });
      invalidateMessagesCache();
      res.status(201).json(msg);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // ── Users ──
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

  app.patch("/api/admin/users/:id/qwerty", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { hasQwerty } = z.object({ hasQwerty: z.number().int().min(0).max(1) }).parse(req.body);
      const updated = await storage.setQwertyAccess(id, hasQwerty);
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

  // ── Game locks ──
  app.get("/api/locked-games", async (_req, res) => {
    const now = Date.now();
    if (lockedGamesCache && now - lockedGamesCache.ts < LOCKED_GAMES_TTL) {
      return res.json(lockedGamesCache.data);
    }
    const list = await storage.getLockedGames();
    lockedGamesCache = { data: list, ts: now };
    res.json(list);
  });

  app.post("/api/admin/games/lock", async (req, res) => {
    try {
      const { gameId, lockedBy } = z.object({
        gameId: z.string().min(1).max(100),
        lockedBy: z.string().min(1).max(20),
      }).parse(req.body);
      await storage.lockGame(gameId, lockedBy);
      invalidateLockedGamesCache();
      res.json({ ok: true });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/admin/games/lock/:gameId", async (req, res) => {
    const ok = await storage.unlockGame(req.params.gameId);
    if (!ok) return res.status(404).json({ message: "Not locked" });
    invalidateLockedGamesCache();
    res.json({ ok: true });
  });

  return httpServer;
}
