import express, { type Request, Response, NextFunction } from "express";
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
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const userStats = {
    total: 0,
    pages: {} as Record<string, number>
  };

  const onlineUsers = new Map<string, string>(); // socketId -> username

  const broadcastOnlineUsers = () => {
    const all = Array.from(onlineUsers.values()).filter(u => u && u !== "System" && !u.toLowerCase().startsWith("guest"));
    const users = [...new Set(all)];
    io.emit("online_users", users);
  };

  // Broadcast online users every 2 seconds
  setInterval(broadcastOnlineUsers, 2000);

  io.on("connection", (socket) => {
    userStats.total++;
    let currentPath = "/";
    
    socket.on("join_page", (path: string) => {
      if (userStats.pages[currentPath]) {
        userStats.pages[currentPath]--;
      }
      currentPath = path;
      userStats.pages[currentPath] = (userStats.pages[currentPath] || 0) + 1;
      io.emit("stats_update", userStats);
    });

    socket.on("user_online", (username: string) => {
      if (username && username.trim()) {
        onlineUsers.set(socket.id, username.trim());
        broadcastOnlineUsers();
      }
    });

    socket.on("disconnect", () => {
      userStats.total--;
      if (userStats.pages[currentPath]) {
        userStats.pages[currentPath]--;
      }
      onlineUsers.delete(socket.id);
      io.emit("stats_update", userStats);
      broadcastOnlineUsers();
    });

    // Initial sync
    socket.emit("stats_update", userStats);
    socket.emit("online_users", Array.from(onlineUsers.values()).filter(u => u && u !== "System" && !u.toLowerCase().startsWith("guest")));
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
