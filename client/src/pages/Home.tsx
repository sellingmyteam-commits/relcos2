import { Layout } from "@/components/Layout";
import { Link, useLocation } from "wouter";
import { MessageSquare, Skull, Zap, Users, Box, Bike, Crosshair, Circle, Target, Egg, Square, Sword, Cuboid, Cctv, Trophy, Goal, Car, Swords, Grid3x3, Heart, Route, Flame, Crown, Gauge, Bomb, Layers, User, Wifi, Mail, Snowflake, Clock, Star, Search, X, Gamepad2, Sprout, Dribbble, Train, Building2, Ghost, Rocket, Baseline, Bird, Telescope, Globe2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useOnlineUsers } from "@/hooks/use-online-users";
import { useGameLocks } from "@/hooks/useGameLocks";
import { Lock } from "lucide-react";
import { useDoor } from "@/components/DoorTransition";

const GAMES = [
  { href: "/pixel-shooter", label: "Pixel Shooter", desc: "Pixel-art FPS with arcade chaos.", icon: Crosshair, color: "primary" },
  { href: "/pvz2-gardenless", label: "PvZ2 Gardenless", desc: "Plants vs Zombies 2 reborn online.", icon: Sprout, color: "purple" },
  { href: "/basketball-stars", label: "Basketball Stars", desc: "Fast-paced 1v1 basketball duels.", icon: Dribbble, color: "pink" },
  { href: "/subway-surfers-houston", label: "Subway Surfers: Houston", desc: "Surf the Houston subway. Don't get caught.", icon: Train, color: "primary" },
  { href: "/russian-buckshot", label: "Russian Buckshot", desc: "Russian roulette with a shotgun.", icon: Bomb, color: "purple" },
  { href: "/rooftop-snipers", label: "Rooftop Snipers", desc: "Knock your opponent off the roof.", icon: Building2, color: "pink" },
  { href: "/nz-portable", label: "COD Zombies", desc: "Survive the undead horde, round after round.", icon: Ghost, color: "primary" },
  { href: "/jetpack-joyride", label: "Jetpack Joyride", desc: "Blast through the lab with a jetpack.", icon: Rocket, color: "purple" },
  { href: "/google-baseball", label: "Google Baseball", desc: "The classic Google Doodle BBQ baseball.", icon: Baseline, color: "pink" },
  { href: "/angry-birds", label: "Angry Birds", desc: "Launch birds at smug green pigs.", icon: Bird, color: "primary" },
  { href: "/double-barrel-sniper", label: "Double Barrel Sniper", desc: "Speedrun targets with a double barrel.", icon: Telescope, color: "purple" },
  { href: "/solar-smash", label: "Solar Smash", desc: "Obliterate planets with cosmic weapons.", icon: Globe2, color: "pink" },
  { href: "/skibidi-shooter", label: "Skibidi Shooter", desc: "Take down skibidi toilets.", icon: Sparkles, color: "primary" },
  { href: "/1v1-lol", label: "1v1.lol", desc: "Build, edit and eliminate your opponents.", icon: Crosshair, color: "purple" },
  { href: "/counter-strike", label: "Counter Strike", desc: "Tactical FPS — eliminate the enemy team.", icon: Target, color: "pink" },
  { href: "/bikers-republic", label: "Bikers Republic", desc: "MX offroad bike racing madness.", icon: Skull, color: "primary" },
  { href: "/10-minutes-till-dawn", label: "10 Min Till Dawn", desc: "Survive waves of monsters until dawn.", icon: Clock, color: "purple" },
  { href: "/baby-sniper-vietnam", label: "Baby Sniper Vietnam", desc: "Tactical sniper action game.", icon: Sword, color: "pink" },
  { href: "/drive-mad", label: "Drive Mad", desc: "Crazy physics-based driving action.", icon: Square, color: "purple" },
  { href: "/snowball-io", label: "Snowball.io", desc: "Throw snowballs and knock out opponents.", icon: Snowflake, color: "pink" },
  { href: "/quake3", label: "Quake 3", desc: "Classic FPS arena combat.", icon: Bomb, color: "purple" },
  { href: "/super-hot", label: "Super Hot", desc: "Time moves only when you move.", icon: Flame, color: "pink" },
  { href: "/eaglercraft", label: "Eagler Craft X", desc: "Minecraft in your browser.", icon: Cuboid, color: "primary" },
  { href: "/shellshockers", label: "Shellshockers", desc: "The world's top egg-based shooter.", icon: Egg, color: "purple" },
  { href: "/geometry-dash", label: "Geometry Dash", desc: "Jump and fly your way through danger!", icon: Zap, color: "pink" },
  { href: "/motox3m", label: "Moto X3M", desc: "The best bike racing game.", icon: Bike, color: "primary" },
  { href: "/five-nights-at-winstons", label: "Five Nights At Winston's", desc: "Survive the night with Winston.", icon: Cctv, color: "purple" },
  { href: "/slope", label: "Slope", desc: "Roll down the slope as fast as you can.", icon: Circle, color: "pink" },
  { href: "/retro-bowl", label: "Retro Bowl", desc: "Classic retro football action.", icon: Goal, color: "primary" },
  { href: "/rocket-soccer", label: "Rocket Soccer", desc: "High-octane car soccer action.", icon: Trophy, color: "purple" },
  { href: "/drift-hunters", label: "Drift Hunters", desc: "3D car drifting on epic tracks.", icon: Car, color: "pink" },
  { href: "/brawl-stars", label: "Brawl Stars", desc: "Fast-paced multiplayer battles.", icon: Swords, color: "primary" },
  { href: "/block-blast", label: "Block Blast", desc: "Addictive block puzzle game.", icon: Grid3x3, color: "purple" },
  { href: "/bitlife", label: "BitLife", desc: "Live your best virtual life.", icon: Heart, color: "pink" },
  { href: "/escape-road", label: "Escape Road", desc: "Outrun the police at all costs.", icon: Route, color: "primary" },
  { href: "/stickman-merge", label: "Stickman Merge", desc: "Merge and fight with your army.", icon: Users, color: "purple" },
  { href: "/car-king", label: "Car King", desc: "Rule the arena in your car.", icon: Crown, color: "primary" },
  { href: "/drift-boss", label: "Drift Boss", desc: "Master the art of drifting.", icon: Gauge, color: "purple" },
  { href: "/tomb-of-the-mask", label: "Tomb of the Mask", desc: "Fast-paced arcade maze runner.", icon: Layers, color: "pink" },
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
  href, label, desc, icon: Icon, color, isFavourite, onToggleFavourite, locked, onLaunch,
}: {
  href: string; label: string; desc: string; icon: React.ElementType;
  color: string; isFavourite: boolean; onToggleFavourite: (e: React.MouseEvent) => void;
  locked?: boolean; onLaunch: (href: string, label: string) => void;
}) {
  const cardInner = (
    <div
      className={cn(
        "p-5 rounded-2xl bg-card/50 border border-white/5 transition-all duration-300 h-full relative overflow-hidden",
        locked
          ? "cursor-not-allowed grayscale opacity-50"
          : cn(
              "cursor-pointer hover:-translate-y-1 hover:shadow-xl",
              color === "purple" ? "hover:shadow-purple-500/20 hover:bg-purple-500/10 hover:border-purple-500/50"
                : color === "pink" ? "hover:shadow-pink-500/20 hover:bg-pink-500/10 hover:border-pink-500/50"
                : "hover:shadow-secondary/20 hover:bg-secondary/10 hover:border-secondary/50"
            )
      )}
      data-testid={`card-game-${href.slice(1)}`}
    >
      <Icon className={cn(
        "w-10 h-10 mb-3 mx-auto transition-transform",
        !locked && "group-hover:scale-110",
        color === "purple" ? "text-purple-500" : color === "pink" ? "text-pink-500" : "text-secondary"
      )} />
      <h3 className="text-base font-bold text-white mb-1 text-center" data-testid={`text-game-${href.slice(1)}`}>{label}</h3>
      <p className="text-xs text-muted-foreground text-center leading-relaxed">{desc}</p>

      {locked && (
        <>
          <div
            className="absolute inset-0 pointer-events-none rounded-2xl"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgba(255,255,255,0.07) 0 1px, transparent 1px 3px)",
              animation: "tv-static 0.12s steps(2) infinite",
              opacity: 0.7,
              mixBlendMode: "screen",
            }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 rounded-2xl backdrop-blur-[2px] pointer-events-none">
            <Lock className="w-6 h-6 text-red-400 mb-1.5" />
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
  const onlineUsers = useOnlineUsers();
  const { favourites, toggle } = useFavourites();
  const [searchQuery, setSearchQuery] = useState("");
  const { isLocked } = useGameLocks();
  const [, setLocation] = useLocation();
  const door = useDoor();

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

          {/* Right side: Live Comms + online users */}
          <div className="flex flex-col gap-2 shrink-0 w-44">
            <Link href="/chat">
              <button
                data-testid="button-live-comms"
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-secondary/10 border border-secondary/30 text-secondary text-xs font-display font-bold uppercase tracking-widest hover:bg-secondary/20 hover:border-secondary/60 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Live Comms
              </button>
            </Link>

            <div className="bg-card/60 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden shadow-xl">
              <div className="px-3 py-2 border-b border-white/10 bg-green-500/5 flex items-center gap-2">
                <Wifi className="w-3 h-3 text-green-400" />
                <span className="text-[10px] font-display font-bold text-green-400 uppercase tracking-wider">Online</span>
                <span className="ml-auto text-[10px] font-mono text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded-full border border-green-500/20">
                  {onlineUsers.length}
                </span>
              </div>
              <div className="overflow-y-auto p-1.5 max-h-28">
                {onlineUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-4 text-muted-foreground/40 gap-1">
                    <Users className="w-4 h-4 opacity-20" />
                    <p className="text-[9px] font-mono text-center">No one online yet</p>
                  </div>
                ) : (
                  onlineUsers.map((user, idx) => (
                    <div key={`${user}-${idx}`} className="flex items-center gap-1.5 px-1.5 py-1 rounded-lg hover:bg-white/5 transition-colors group">
                      <div className="relative shrink-0">
                        <div className="w-4 h-4 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                          <User className="w-2 h-2 text-green-400" />
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-green-400 border border-card animate-pulse" />
                      </div>
                      <span className={cn("text-[10px] font-medium truncate flex-1", user === username ? "text-secondary" : "text-white")}>
                        {user === username ? `${user} (you)` : user}
                      </span>
                      {user !== username && (
                        <Link href={`/chat?dm=${encodeURIComponent(user)}`}>
                          <button
                            data-testid={`button-dm-${user}`}
                            title={`DM ${user}`}
                            className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-accent/10 border border-accent/20 text-accent hover:bg-accent/25 transition-colors"
                          >
                            <Mail className="w-2 h-2" />
                            DM
                          </button>
                        </Link>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

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
