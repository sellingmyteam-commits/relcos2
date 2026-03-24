# RE1C's ARUA Games

## Overview

A gaming portal web application that hosts browser-based games (Eaglercraft, Shellshockers, Geometry Dash, Retro Bowl, Drift Hunters, Brawl Stars, Block Blast, BitLife, Escape Road, SuperHot, Moto X3M, Stickman Merge, Slope, Rocket Soccer, Five Nights At Winston's, Car King, Drift Boss, Quake 3, Tomb of the Mask) with an integrated live chat system. The application features a cyberpunk/gaming-themed UI with real-time messaging capabilities and WebSocket-based online user tracking.

### Static Game File Serving
- Game HTML files are stored in `public/game/` directory
- In development, an `express.static` middleware is registered for `/game` BEFORE Vite's middleware in `server/vite.ts` to prevent Vite from intercepting game HTML requests and serving the SPA fallback
- In production, `express.static` in `server/static.ts` handles this naturally
- Games use `<base href>` tags to load assets from CDNs (jsdelivr, githack, etc.)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and caching
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Animations**: Framer Motion for page transitions and interactive effects
- **Build Tool**: Vite with custom path aliases (@/, @shared/, @assets/)

The frontend follows a page-based architecture with shared layout components. Game pages embed external games via iframes with fullscreen support and include a sidebar chat component for real-time communication.

### Backend Architecture
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript with ESM modules
- **API Pattern**: REST endpoints defined in shared/routes.ts with Zod validation
- **Development**: Hot module replacement via Vite middleware
- **Production**: Static file serving from dist/public

The server uses a shared schema approach where API routes, input validation, and response types are defined once and used by both client and server. This ensures type safety across the full stack.

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: shared/schema.ts
- **Migrations**: Drizzle Kit with migrations output to /migrations
- **Current Schema**: Messages table for public chat (id, username, content, createdAt), DirectMessages table for DMs (id, fromUser, toUser, content, createdAt)

### Real-time Features
- **WebSocket**: Native ws library for online user count broadcasting
- **Chat Polling**: React Query with 1-second refetch interval for live chat updates

### Build System
- **Client Build**: Vite outputs to dist/public
- **Server Build**: esbuild bundles server code to dist/index.cjs
- **Bundled Dependencies**: Common packages (express, drizzle-orm, pg, ws, zod, etc.) are bundled to reduce cold start times

## External Dependencies

### Database
- PostgreSQL database required (connection via DATABASE_URL environment variable)
- Drizzle ORM for database operations with drizzle-zod for schema validation

### UI Components
- shadcn/ui component library with Radix UI primitives
- Full component set including dialogs, forms, navigation, and data display components

### External Game Sources
- Eaglercraft: Self-hosted HTML file (EaglercraftX_1.8_u53_Offline_Signed.html)
- Shellshockers: Embedded from eggshock.net
- Geometry Dash: Self-hosted HTML file with external CDN assets from githack.com

### Fonts
- Google Fonts: Orbitron (display), Rajdhani (body), Share Tech Mono (monospace)

### Development Tools
- Replit-specific plugins: vite-plugin-runtime-error-modal, vite-plugin-cartographer, vite-plugin-dev-banner

## Ad Configuration

Google AdSense is integrated via `client/src/components/AdUnit.tsx`. The publisher script is in `client/index.html`.

- **Publisher ID**: `ca-pub-7010986673001515` (hardcoded in `index.html` and `AdUnit.tsx`)
- Two ad placements on the Home page only (not on game pages): one skyscraper on the left of the title, one on the right

To activate real ads after AdSense approval, create ad units in the AdSense dashboard and set these environment variables:

| Variable | Where to get it | Description |
|---|---|---|
| `VITE_ADSENSE_SLOT_LEFT` | AdSense dashboard → Ad units | Slot ID for the left skyscraper beside the title |
| `VITE_ADSENSE_SLOT_RIGHT` | AdSense dashboard → Ad units | Slot ID for the right skyscraper beside the title |

Until these are set, the ad spaces show a subtle placeholder outline so the layout is visible. Ads only show on large screens (lg: breakpoint and above) — hidden on mobile.