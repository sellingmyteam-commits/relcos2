---
name: External npm deployments
description: Avoid Replit-only package registry URLs when building this project outside Replit.
---

When deploying this project on an external builder such as Vercel, every package-lock resolved URL must use a publicly reachable HTTPS registry; Replit's package-firewall host is internal to Replit.

**Why:** Vercel installs dependencies from the committed lockfile before running the build, so an internal resolved URL fails with a DNS error even when package names and integrity hashes are valid.

**How to apply:** Before an external deployment, search the lockfile for `package-firewall.replit.local` and replace only those resolved registry hosts with `https://registry.npmjs.org/`, preserving versions and integrity hashes.