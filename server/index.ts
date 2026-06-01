import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));
app.use(compression());

const isProd = process.env.NODE_ENV === "production";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  if (isProd) return next();
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  // Real-time online user tracking with Socket.IO
  const { Server } = await import("socket.io");
  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    pingInterval: 25000,
    pingTimeout: 20000,
    transports: ["websocket", "polling"],
  });

  const userStats = {
    total: 0,
    pages: {} as Record<string, number>,
    onlineUserIds: [] as string[],
    onlineUsers: [] as { id: string; username: string }[],
  };

  // userId → socketId mapping for targeted events
  const userSocketMap: Record<string, string> = {};
  const socketUserMap: Record<string, string> = {};
  const onlineUserIds = new Set<string>();
  const onlineUsernames: Record<string, string> = {}; // userId → username

  const broadcastStats = () => {
    userStats.onlineUserIds = Array.from(onlineUserIds);
    userStats.onlineUsers = Array.from(onlineUserIds).map((id) => ({
      id,
      username: onlineUsernames[id] || "",
    }));
    io.emit("stats_update", userStats);
  };

  io.on("connection", (socket) => {
    userStats.total++;
    let currentPath = "/";

    socket.on("user_identify", (payload: string | { userId: string; username?: string }) => {
      const userId = typeof payload === "string" ? payload : payload?.userId;
      const username = typeof payload === "object" ? (payload?.username || "") : "";
      if (!userId) return;
      socketUserMap[socket.id] = userId;
      userSocketMap[userId] = socket.id;
      onlineUserIds.add(userId);
      if (username) onlineUsernames[userId] = username;
      broadcastStats();
    });

    socket.on("join_page", (path: string) => {
      if (userStats.pages[currentPath]) {
        userStats.pages[currentPath]--;
        if (userStats.pages[currentPath] <= 0) delete userStats.pages[currentPath];
      }
      currentPath = path;
      userStats.pages[currentPath] = (userStats.pages[currentPath] || 0) + 1;
      broadcastStats();
    });

    socket.on("trigger_qwerty_hack", (targetUserId: string) => {
      const targetSocketId = userSocketMap[targetUserId];
      if (targetSocketId) {
        io.to(targetSocketId).emit("qwerty_hack");
      }
    });

    socket.on("disconnect", () => {
      userStats.total--;
      if (userStats.pages[currentPath]) {
        userStats.pages[currentPath]--;
        if (userStats.pages[currentPath] <= 0) delete userStats.pages[currentPath];
      }
      const uid = socketUserMap[socket.id];
      if (uid) {
        delete userSocketMap[uid];
        delete socketUserMap[socket.id];
        onlineUserIds.delete(uid);
        delete onlineUsernames[uid];
      }
      broadcastStats();
    });

    socket.emit("stats_update", {
      ...userStats,
      onlineUserIds: Array.from(onlineUserIds),
      onlineUsers: Array.from(onlineUserIds).map((id) => ({ id, username: onlineUsernames[id] || "" })),
    });
  });

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
