import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

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
  app.get(api.messages.list.path, async (req, res) => {
    const msgs = await storage.getMessages();
    res.json(msgs.reverse());
  });

  app.post(api.messages.create.path, async (req, res) => {
    try {
      const input = api.messages.create.input.parse(req.body);
      const siteUser = await storage.getSiteUserByUsername(input.username);
      if (siteUser && siteUser.isMuted) {
        return res.status(403).json({ message: "You are muted from global chat." });
      }
      const filtered = filterContent(input.content);
      if (!filtered.trim()) {
        return res.status(400).json({ message: "Message blocked by chat filter" });
      }
      const message = await storage.createMessage({ ...input, content: filtered });
      res.status(201).json(message);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.get("/api/users", async (req, res) => {
    const users = await storage.getAllUsers();
    res.json(users);
  });

  app.get("/api/dm/conversations/:username", async (req, res) => {
    const { username } = req.params;
    const conversations = await storage.getConversations(username);
    res.json(conversations);
  });

  app.get("/api/dm/latest/:username", async (req, res) => {
    const { username } = req.params;
    const latest = await storage.getLatestDmFor(username);
    res.json(latest);
  });

  app.get("/api/dm/unread/:username", async (req, res) => {
    const { username } = req.params;
    const counts = await storage.getUnreadCounts(username);
    res.json(counts);
  });

  app.post("/api/dm/read", async (req, res) => {
    try {
      const { currentUser, otherUser } = z.object({
        currentUser: z.string().min(1),
        otherUser: z.string().min(1),
      }).parse(req.body);
      await storage.markConversationRead(currentUser, otherUser);
      res.json({ ok: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete("/api/dm/conversations/:username/:otherUser", async (req, res) => {
    const { username, otherUser } = req.params;
    await storage.hideConversation(username, otherUser);
    res.json({ ok: true });
  });

  app.get("/api/dm/:user1/:user2", async (req, res) => {
    const { user1, user2 } = req.params;
    const dms = await storage.getDirectMessages(user1, user2);
    res.json(dms);
    // Auto-mark messages from user2 to user1 as read (fire-and-forget, non-blocking)
    storage.markConversationRead(user1, user2).catch(() => {});
  });

  app.post(api.dm.create.path, async (req, res) => {
    try {
      const input = api.dm.create.input.parse(req.body);
      const dm = await storage.createDirectMessage(input);
      res.status(201).json(dm);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
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

  app.get("/api/user/status/id/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    const user = await storage.getSiteUserById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  });

  app.get("/api/admin/users", async (req, res) => {
    const users = await storage.getAllSiteUsers();
    res.json(users);
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

  const existingMessages = await storage.getMessages();
  if (existingMessages.length === 0) {
    await storage.createMessage({ username: "System", content: "Welcome to the chat! Be nice to each other." });
  }

  return httpServer;
}
