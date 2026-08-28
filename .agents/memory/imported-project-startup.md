---
name: Imported project startup
description: A Replit-specific startup check for imported npm projects.
---

Imported npm projects can arrive with `package.json` and `package-lock.json` present while `node_modules` is absent. A workflow that invokes a local binary will fail before application code runs.

**Why:** The first preview failure in this project was caused by the missing local `tsx` binary, not by the server or frontend.

**How to apply:** For future imported Node projects, inspect the package metadata and install the managed Node dependencies before diagnosing application-level workflow failures.