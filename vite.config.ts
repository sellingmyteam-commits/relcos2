import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const staticGameEntryFiles = [
  "five-nights-at-epsteins.html",
  "idle-miner-tycoon.html",
  "skibidi-shooter.html",
  "russian-buckshot.html",
];

function emitStaticGameEntries(): Plugin {
  return {
    name: "emit-static-game-entries",
    apply: "build" as const,
    generateBundle() {
      for (const fileName of staticGameEntryFiles) {
        const sourcePath = path.resolve(import.meta.dirname, "public", "game", fileName);
        if (!fs.existsSync(sourcePath)) {
          throw new Error(`Missing static game entry: ${sourcePath}`);
        }

        this.emitFile({
          type: "asset",
          fileName: `game/${fileName}`,
          source: fs.readFileSync(sourcePath),
        });
      }
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    emitStaticGameEntries(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
