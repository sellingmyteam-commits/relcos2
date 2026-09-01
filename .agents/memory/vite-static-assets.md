---
name: Vite static game files
description: How this project exposes game entry files in Vercel's Vite build.
---

Because the Vite root is the client directory, Vite automatically copies client/public, not the repository-level public directory, into dist/public. Server routes can still serve repository-level public files during Replit development, which can hide missing Vercel assets.

**Why:** An iframe can receive the SPA fallback HTML instead of a game file when its entry file exists only under root public, producing a 404 or reopening the site inside the game window.

**How to apply:** Keep Vercel game entry files in client/public or explicitly emit them during the production Vite build; verify every iframe source against dist/public before deploying.