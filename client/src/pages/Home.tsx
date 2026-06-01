import { Layout } from "@/components/Layout";
import { useLocation } from "wouter";
import { MessageSquare, Skull, Zap, Users, Bike, Circle, Target, Egg, Square, Cuboid, Cctv, Trophy, Goal, Car, Swords, Grid3x3, Heart, Route, Flame, Gauge, Layers, Snowflake, Star, Search, X, Gamepad2, Sprout, Dribbble, Train, Ghost, Rocket, Globe2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useGameLocks } from "@/hooks/useGameLocks";
import { Lock, Wifi } from "lucide-react";
import { useDoor } from "@/components/DoorTransition";
import { usePageCounts } from "@/hooks/usePageCounts";
import { useOnlineCount } from "@/hooks/useOnlineCount";
import { reIdentifyUser } from "@/lib/socket";
import { useQuery } from "@tanstack/react-query";

const GAMES = [
  { href: "/recoil", label: "Recoil", desc: "Physics-based shooting. Every shot pushes back.", icon: Zap, color: "pink" },
  { href: "/fireboy-and-watergirl", label: "Fireboy and Watergirl", desc: "Work together — fire and water must survive.", icon: Flame, color: "pink" },
  { href: "/snow-rider", label: "Snow Rider 3D", desc: "Race down snow-covered hills and pull off sick tricks.", icon: Snowflake, color: "purple" },
  { href: "/cookie-clicker", label: "Cookie Clicker", desc: "Click cookies. Build an empire. Never stop.", icon: Star, color: "primary" },
  { href: "/slope", label: "Slope", desc: "Roll down the slope as fast as you can.", icon: Circle, color: "pink" },
  { href: "/nz-portable", label: "COD Zombies", desc: "Survive the undead horde, round after round.", icon: Ghost, color: "primary" },
  { href: "/eaglercraft", label: "Eagler Craft X", desc: "Minecraft in your browser.", icon: Cuboid, color: "primary" },
  { href: "/drive-mad", label: "Drive Mad", desc: "Crazy physics-based driving action.", icon: Square, color: "purple" },
  { href: "/geometry-dash", label: "Geometry Dash", desc: "Jump and fly your way through danger!", icon: Zap, color: "pink" },
  { href: "/pvz2-gardenless", label: "PvZ2 Gardenless", desc: "Plants vs Zombies 2 reborn online.", icon: Sprout, color: "purple" },
  { href: "/basketball-stars", label: "Basketball Stars", desc: "Fast-paced 1v1 basketball duels.", icon: Dribbble, color: "pink" },
  { href: "/subway-surfers-houston", label: "Subway Surfers: Houston", desc: "Surf the Houston subway. Don't get caught.", icon: Train, color: "primary" },
  { href: "/jetpack-joyride", label: "Jetpack Joyride", desc: "Blast through the lab with a jetpack.", icon: Rocket, color: "purple" },
  { href: "/solar-smash", label: "Solar Smash", desc: "Obliterate planets with cosmic weapons.", icon: Globe2, color: "pink" },
  { href: "/counter-strike", label: "Counter Strike", desc: "Tactical FPS — eliminate the enemy team.", icon: Target, color: "pink" },
  { href: "/bikers-republic", label: "Bikers Republic", desc: "MX offroad bike racing madness.", icon: Skull, color: "primary" },
  { href: "/snowball-io", label: "Snowball.io", desc: "Throw snowballs and knock out opponents.", icon: Snowflake, color: "pink" },
  { href: "/super-hot", label: "Super Hot", desc: "Time moves only when you move.", icon: Flame, color: "pink" },
  { href: "/shellshockers", label: "Shellshockers", desc: "The world's top egg-based shooter.", icon: Egg, color: "purple" },
  { href: "/motox3m", label: "Moto X3M", desc: "The best bike racing game.", icon: Bike, color: "primary" },
  { href: "/retro-bowl", label: "Retro Bowl", desc: "Classic retro football action.", icon: Goal, color: "primary" },
  { href: "/rocket-soccer", label: "Rocket Soccer", desc: "High-octane car soccer action.", icon: Trophy, color: "purple" },
  { href: "/drift-hunters", label: "Drift Hunters", desc: "3D car drifting on epic tracks.", icon: Car, color: "pink" },
  { href: "/brawl-stars", label: "Brawl Stars", desc: "Fast-paced multiplayer battles.", icon: Swords, color: "primary" },
  { href: "/block-blast", label: "Block Blast", desc: "Addictive block puzzle game.", icon: Grid3x3, color: "purple" },
  { href: "/bitlife", label: "BitLife", desc: "Live your best virtual life.", icon: Heart, color: "pink" },
  { href: "/escape-road", label: "Escape Road", desc: "Outrun the police at all costs.", icon: Route, color: "primary" },
  { href: "/stickman-merge", label: "Stickman Merge", desc: "Merge and fight with your army.", icon: Users, color: "purple" },
  { href: "/drift-boss", label: "Drift Boss", desc: "Master the art of drifting.", icon: Gauge, color: "purple" },
  { href: "/tomb-of-the-mask", label: "Tomb of the Mask", desc: "Fast-paced arcade maze runner.", icon: Layers, color: "pink" },
  { href: "/bowmasters", label: "Bowmasters", desc: "Draw your bow and take out your rivals.", icon: Target, color: "pink" },
  { href: "/gun-spin", label: "Gun Spin", desc: "Spin your gun and blast through enemies.", icon: Gauge, color: "purple" },
  { href: "/idle-miner-tycoon", label: "Idle Miner Tycoon", desc: "Mine your way to riches while you idle.", icon: Layers, color: "purple" },
  { href: "/hole-io", label: "Hole.io", desc: "Swallow everything in sight with your hole.", icon: Circle, color: "pink" },
  { href: "/chat", label: "Live Comms", desc: "Talk trash in real-time.", icon: MessageSquare, color: "primary" },
];

function useFavourites() {
  const [favourites, setFavourites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("favouriteGames") || "[]");
    } catch {
      return [];
    }
  });

  const toggle = (href: string) => {
    setFavourites(prev => {
      const next = prev.includes(href) ? prev.filter(h => h !== href) : [...prev, href];
      localStorage.setItem("favouriteGames", JSON.stringify(next));
      queueMicrotask(() => window.dispatchEvent(new Event("favourites-updated")));
      return next;
    });
  };

  return { favourites, toggle };
}

function GameCard({
  href, label, desc, icon: Icon, color, isFavourite, onToggleFavourite, locked, onLaunch, onlineCount,
}: {
  href: string; label: string; desc: string; icon: React.ElementType;
  color: string; isFavourite: boolean; onToggleFavourite: (e: React.MouseEvent) => void;
  locked?: boolean; onLaunch: (href: string, label: string) => void; onlineCount?: number;
}) {
  const glowColor = color === "purple" ? "rgba(140,60,255,0.55)" : color === "pink" ? "rgba(255,0,193,0.55)" : "rgba(0,255,249,0.55)";
  const hoverBorder = color === "purple" ? "rgba(140,60,255,0.45)" : color === "pink" ? "rgba(255,0,193,0.45)" : "rgba(0,255,249,0.45)";
  const hoverBg = color === "purple" ? "rgba(140,60,255,0.12)" : color === "pink" ? "rgba(255,0,193,0.12)" : "rgba(0,255,249,0.12)";

  const cardInner = (
    <div
      className={cn(
        "p-5 rounded-2xl border transition-all duration-300 h-full relative overflow-hidden group/card",
        locked
          ? "locked-glitch cursor-not-allowed border-red-500/40"
          : "cursor-pointer hover:-translate-y-1"
      )}
      style={locked ? {
        background: "rgba(60,0,0,0.55)",
        backdropFilter: "blur(12px)",
      } : {
        background: "rgba(5,8,25,0.55)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
      onMouseEnter={e => {
        if (!locked) {
          (e.currentTarget as HTMLElement).style.background = hoverBg;
          (e.currentTarget as HTMLElement).style.borderColor = hoverBorder;
          (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px ${glowColor.replace("0.55", "0.2")}, 0 0 0 1px ${hoverBorder}`;
        }
      }}
      onMouseLeave={e => {
        if (!locked) {
          (e.currentTarget as HTMLElement).style.background = "rgba(5,8,25,0.55)";
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
          (e.currentTarget as HTMLElement).style.boxShadow = "";
        }
      }}
      data-testid={`card-game-${href.slice(1)}`}
    >
      <Icon className={cn(
        "w-10 h-10 mb-3 mx-auto transition-transform group-hover/card:scale-110",
        locked && "locked-icon text-red-400",
        !locked && (color === "purple" ? "text-purple-400" : color === "pink" ? "text-pink-400" : "text-cyan-400")
      )} />
      <h3
        className={cn(
          "text-base font-bold mb-1 text-center",
          locked ? "locked-title text-red-200" : "text-white"
        )}
        data-testid={`text-game-${href.slice(1)}`}
      >
        {label}
      </h3>
      <p className={cn("text-xs text-center leading-relaxed", locked ? "text-red-300/70" : "text-white/45")}>{desc}</p>

      {!locked && onlineCount && onlineCount > 0 ? (
        <div className="absolute bottom-2.5 left-3 flex items-center gap-1">
          <Wifi className="w-3 h-3 text-green-400" style={{ filter: "drop-shadow(0 0 3px #4ade80)" }} />
          <span className="text-[9px] font-mono text-green-400/80">{onlineCount}</span>
        </div>
      ) : null}

      {locked && (
        <>
          <div
            className="absolute inset-0 pointer-events-none rounded-2xl"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, rgba(255,80,80,0.18) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgba(0,200,255,0.12) 0 1px, transparent 1px 3px)",
              animation: "tv-static 0.08s steps(2) infinite",
              opacity: 0.85,
              mixBlendMode: "screen",
            }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/65 rounded-2xl backdrop-blur-[2px] pointer-events-none z-30">
            <Lock className="w-6 h-6 text-red-400 mb-1.5 drop-shadow-[0_0_8px_rgba(255,80,80,0.7)]" />
            <p className="text-[9px] font-mono text-red-300 uppercase tracking-[0.2em] text-center px-2 leading-tight">
              Game Locked<br/>by Admin
            </p>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="relative group">
      {locked ? cardInner : (
        <button
          type="button"
          onClick={() => onLaunch(href, label)}
          className="block w-full text-left"
          data-testid={`launch-game-${href.slice(1)}`}
        >
          {cardInner}
        </button>
      )}
      <button
        onClick={onToggleFavourite}
        data-testid={`button-favourite-${href.slice(1)}`}
        title={isFavourite ? "Remove from favourites" : "Add to favourites"}
        className={cn(
          "absolute top-2.5 right-2.5 p-1 rounded-full transition-all duration-200 z-10",
          isFavourite
            ? "text-yellow-400 opacity-100 hover:text-yellow-300 hover:scale-110"
            : "text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-yellow-400 hover:scale-110"
        )}
      >
        <Star className={cn("w-4 h-4", isFavourite && "fill-yellow-400")} />
      </button>
    </div>
  );
}

export default function Home() {
  const username = localStorage.getItem("chatUsername") || "";
  const { favourites, toggle } = useFavourites();
  const [searchQuery, setSearchQuery] = useState("");
  const { isLocked } = useGameLocks();
  const [, setLocation] = useLocation();
  const door = useDoor();
  const pageCounts = usePageCounts();

  const onlineCount = useOnlineCount();

  const { data: onlineUsers = [] } = useQuery<{ id: string; username: string }[]>({
    queryKey: ["/api/online-users"],
    refetchInterval: 3000,
  });

  // Re-announce username to server on mount so existing connections get their name tracked
  useEffect(() => {
    const userId = localStorage.getItem("siteUserId");
    if (userId) reIdentifyUser(userId);
  }, []);

  const handleLaunch = (href: string, label: string) => {
    door.open(label, () => setLocation(href));
  };

  const filteredGames = searchQuery.trim()
    ? GAMES.filter(g => g.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : GAMES;

  const favouriteGames = filteredGames.filter(g => favourites.includes(g.href));
  const otherGames = filteredGames.filter(g => !favourites.includes(g.href));

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.045, delayChildren: 0.05 } } };
  const item = {
    hidden: { opacity: 0, y: 24, scale: 0.92 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 260, damping: 22 } },
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 tracking-tighter leading-none mb-2">
              WELCOME BACK <span className="text-secondary">USER</span>
            </h1>
            <p className="text-sm font-mono text-muted-foreground/70 border-l-2 border-accent pl-3">
              "You're meant to do your school work but we all know this is better."
            </p>
          </div>

          {/* Online counter + user list */}
          <div
            className="rounded-xl border shrink-0 self-start overflow-hidden"
            style={{
              background: "rgba(0,255,100,0.05)",
              borderColor: "rgba(0,255,100,0.2)",
              boxShadow: "0 0 20px rgba(0,255,100,0.06)",
              minWidth: "180px",
            }}
          >
            {/* Count row */}
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-full shrink-0"
                style={{ background: "rgba(0,255,100,0.1)" }}>
                <Wifi className="w-4 h-4" style={{ color: "#4ade80" }} />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-background"
                  style={{ animation: "home-pulse 2s ease-in-out infinite" }} />
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-display font-black leading-none" style={{ color: "#4ade80" }}>
                    {onlineCount}
                  </span>
                  <span className="text-xs font-mono font-bold uppercase tracking-widest" style={{ color: "rgba(74,222,128,0.6)" }}>
                    online
                  </span>
                </div>
                <p className="text-[10px] font-mono mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>
                  users on the site
                </p>
              </div>
            </div>

            {/* User list */}
            {onlineUsers.length > 0 && (
              <div style={{ borderTop: "1px solid rgba(0,255,100,0.12)" }}>
                <div className="px-3 py-2 max-h-40 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                  {onlineUsers.map((u) => (
                    <div key={u.id} className="flex items-center gap-2 py-0.5">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#4ade80", boxShadow: "0 0 4px #4ade80" }} />
                      <span className="text-xs font-mono truncate" style={{ color: u.username ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.25)" }}>
                        {u.username || "anonymous"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <style>{`
          @keyframes home-pulse {
            0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(74,222,128,0.4); }
            50%       { opacity: 0.7; box-shadow: 0 0 0 4px rgba(74,222,128,0); }
          }
        `}</style>

        {/* Search bar */}
        <div className="mb-6">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search games..."
              data-testid="input-home-search"
              className="w-full pl-9 pr-8 h-10 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-muted-foreground outline-none focus:border-secondary/50 focus:bg-secondary/5 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Favourites */}
        {favouriteGames.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <h2 className="text-sm font-display font-bold text-yellow-400 uppercase tracking-widest">Favourites</h2>
              <div className="flex-1 h-px bg-yellow-400/20" />
            </div>
            <motion.div variants={container} initial="hidden" animate="show"
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {favouriteGames.map(({ href, label, desc, icon, color }) => (
                <motion.div key={href} variants={item} whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 22 }}>
                  <GameCard href={href} label={label} desc={desc} icon={icon} color={color}
                    isFavourite={true} locked={isLocked(href)}
                    onLaunch={handleLaunch}
                    onlineCount={pageCounts[href] || 0}
                    onToggleFavourite={(e) => { e.preventDefault(); e.stopPropagation(); toggle(href); }} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}

        {/* All games */}
        <div>
          {(favouriteGames.length > 0 || searchQuery) && (
            <div className="flex items-center gap-2 mb-3">
              <Gamepad2 className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-display font-bold text-muted-foreground uppercase tracking-widest">
                {searchQuery ? `Results (${filteredGames.length})` : "All Games"}
              </h2>
              <div className="flex-1 h-px bg-white/5" />
            </div>
          )}

          {otherGames.length === 0 && favouriteGames.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/50 gap-3">
              <Search className="w-8 h-8 opacity-30" />
              <p className="text-sm font-mono">No games found for "{searchQuery}"</p>
            </div>
          )}

          <motion.div variants={container} initial="hidden" animate="show"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {otherGames.map(({ href, label, desc, icon, color }) => (
              <motion.div key={href} variants={item} whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 22 }}>
                <GameCard href={href} label={label} desc={desc} icon={icon} color={color}
                  isFavourite={false} locked={isLocked(href)}
                  onLaunch={handleLaunch}
                  onlineCount={pageCounts[href] || 0}
                  onToggleFavourite={(e) => { e.preventDefault(); e.stopPropagation(); toggle(href); }} />
              </motion.div>
            ))}
          </motion.div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-12 pb-8 text-xs font-mono text-muted-foreground/40">
          <Zap className="w-3 h-3" />
          <span>SYSTEM ONLINE • SECURE CONNECTION • READY TO PLAY</span>
        </div>
      </div>
    </Layout>
  );
}
