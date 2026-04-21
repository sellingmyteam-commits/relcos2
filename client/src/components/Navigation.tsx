import { Link, useLocation } from "wouter";
import { Shield, Users, Maximize2, Search, Box, Egg, Zap, Bike, Circle, Goal, Trophy, Car, Swords, Grid3x3, Heart, Route, Flame, Cctv, MessageSquare, Crown, Gauge, Bomb, Layers, Settings, Crosshair, Target, Skull, Clock, Sword, Square, Snowflake, Cuboid, Home, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { getSharedSocket } from "@/lib/socket";
import { Button } from "@/components/ui/button";
import { AdminPanel } from "@/components/AdminPanel";
import { SettingsPanel } from "@/components/SettingsPanel";

export const ALL_GAMES = [
  { href: "/", label: "Home", icon: Home },
  { href: "/1v1-lol", label: "1v1.lol", icon: Crosshair },
  { href: "/counter-strike", label: "Counter Strike", icon: Target },
  { href: "/bikers-republic", label: "Bikers Republic", icon: Skull },
  { href: "/10-minutes-till-dawn", label: "10 Min Till Dawn", icon: Clock },
  { href: "/baby-sniper-vietnam", label: "Baby Sniper Vietnam", icon: Sword },
  { href: "/chess", label: "Chess Classic", icon: Box },
  { href: "/drive-mad", label: "Drive Mad", icon: Square },
  { href: "/snowball-io", label: "Snowball.io", icon: Snowflake },
  { href: "/quake3", label: "Quake 3", icon: Bomb },
  { href: "/super-hot", label: "Super Hot", icon: Flame },
  { href: "/eaglercraft", label: "Eagler Craft X", icon: Cuboid },
  { href: "/shellshockers", label: "Shellshockers", icon: Egg },
  { href: "/geometry-dash", label: "Geometry Dash", icon: Zap },
  { href: "/motox3m", label: "Moto X3M", icon: Bike },
  { href: "/five-nights-at-winstons", label: "Five Nights At Winston's", icon: Cctv },
  { href: "/slope", label: "Slope", icon: Circle },
  { href: "/retro-bowl", label: "Retro Bowl", icon: Goal },
  { href: "/rocket-soccer", label: "Rocket Soccer", icon: Trophy },
  { href: "/drift-hunters", label: "Drift Hunters", icon: Car },
  { href: "/brawl-stars", label: "Brawl Stars", icon: Swords },
  { href: "/block-blast", label: "Block Blast", icon: Grid3x3 },
  { href: "/bitlife", label: "BitLife", icon: Heart },
  { href: "/escape-road", label: "Escape Road", icon: Route },
  { href: "/stickman-merge", label: "Stickman Merge", icon: Users },
  { href: "/car-king", label: "Car King", icon: Crown },
  { href: "/drift-boss", label: "Drift Boss", icon: Gauge },
  { href: "/tomb-of-the-mask", label: "Tomb of the Mask", icon: Layers },
  { href: "/chat", label: "Live Comms", icon: MessageSquare },
];

export function Navigation() {
  const [location, setLocation] = useLocation();
  const [onlineCount, setOnlineCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const socket = getSharedSocket();
    const handleOnlineUsers = (users: string[]) => {
      setOnlineCount(users.length);
    };
    socket.on("online_users", handleOnlineUsers);
    socket.emit("join_page", location);
    return () => {
      socket.off("online_users", handleOnlineUsers);
    };
  }, [location]);

  useEffect(() => {
    const checkAdmin = async () => {
      const storedId = localStorage.getItem("siteUserId");
      if (!storedId) return;
      try {
        const res = await fetch(`/api/user/status/id/${storedId}`);
        if (res.ok) {
          const data = await res.json();
          setIsAdmin(!!data.isAdmin);
        }
      } catch {}
    };
    checkAdmin();
    const interval = setInterval(checkAdmin, 10000);
    return () => clearInterval(interval);
  }, []);

  const toggleFullScreen = () => {
    window.dispatchEvent(new CustomEvent('toggle-fullscreen'));
  };

  const filtered = ALL_GAMES.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isGamePage = location !== "/" && location !== "/chat";

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 bottom-0 z-50 flex flex-col transition-all duration-300 ease-in-out",
          "bg-background/95 backdrop-blur-md border-r border-white/10",
          collapsed ? "w-14" : "w-56"
        )}
      >
        {/* Logo */}
        <div className={cn("flex items-center h-14 border-b border-white/10 px-3 shrink-0", collapsed ? "justify-center" : "justify-between gap-2")}>
          {!collapsed && (
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer group" data-testid="link-logo">
                <Shield className="w-5 h-5 text-secondary shrink-0 group-hover:scale-110 transition-transform duration-300" />
                <span className="text-base font-display font-black tracking-tighter text-white group-hover:text-secondary transition-colors duration-300 truncate">
                  RELC.OS
                </span>
              </div>
            </Link>
          )}
          {collapsed && (
            <Link href="/">
              <Shield className="w-5 h-5 text-secondary cursor-pointer hover:scale-110 transition-transform duration-300" data-testid="link-logo-collapsed" />
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            data-testid="button-sidebar-toggle"
            className="p-1 rounded-md text-muted-foreground hover:text-white hover:bg-white/5 transition-colors shrink-0"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Search */}
        {!collapsed && (
          <div className="px-3 py-2 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2 px-3 h-8 rounded-lg bg-white/5 border border-white/10 focus-within:border-secondary/50 focus-within:bg-secondary/5 transition-all">
              <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search games..."
                data-testid="input-game-search"
                className="bg-transparent text-xs text-white placeholder:text-muted-foreground outline-none w-full"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-muted-foreground hover:text-white transition-colors">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Nav items */}
        <div className="flex-1 overflow-y-auto py-2 px-2 scrollbar-thin">
          {filtered.map(({ href, label, icon: Icon }) => {
            const isActive = location === href;
            return (
              <button
                key={href}
                data-testid={`link-game-${href.slice(1) || "home"}`}
                onClick={() => {
                  setLocation(href);
                  setSearchQuery("");
                }}
                title={collapsed ? label : undefined}
                className={cn(
                  "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all duration-200 mb-0.5",
                  collapsed ? "justify-center" : "",
                  isActive
                    ? "bg-secondary/15 text-secondary border border-secondary/30"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-secondary" : "")} />
                {!collapsed && <span className="text-xs font-medium truncate">{label}</span>}
                {!collapsed && isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-secondary shrink-0" />}
              </button>
            );
          })}
          {filtered.length === 0 && !collapsed && (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">No results found</div>
          )}
        </div>

        {/* Bottom actions */}
        <div className={cn("border-t border-white/10 p-2 flex flex-col gap-1 shrink-0", collapsed ? "items-center" : "")}>
          {/* Online count */}
          <div className={cn(
            "flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10",
            collapsed ? "justify-center" : ""
          )}>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
            {!collapsed && (
              <span className="font-mono text-[10px] font-bold text-secondary whitespace-nowrap" data-testid="text-online-count">
                {onlineCount} ONLINE
              </span>
            )}
          </div>

          {/* Fullscreen (game pages only) */}
          {isGamePage && (
            <Button
              variant="default"
              size="sm"
              onClick={toggleFullScreen}
              data-testid="button-fullscreen"
              className={cn(
                "bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg h-8 text-xs flex items-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/20",
                collapsed ? "w-8 px-0 justify-center" : "w-full px-3"
              )}
            >
              <Maximize2 className="w-3 h-3 shrink-0" />
              {!collapsed && <span>FULLSCREEN</span>}
            </Button>
          )}

          {/* Settings */}
          <button
            onClick={() => setShowSettingsPanel(true)}
            data-testid="button-settings-panel"
            title={collapsed ? "Settings" : undefined}
            className={cn(
              "flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-muted-foreground text-[10px] font-bold font-mono tracking-widest uppercase hover:bg-white/10 hover:text-white hover:border-white/20 transition-all",
              collapsed ? "justify-center w-full" : "w-full"
            )}
          >
            <Settings className="w-3.5 h-3.5 shrink-0" />
            {!collapsed && <span>SETTINGS</span>}
          </button>

          {/* Admin */}
          {isAdmin && (
            <button
              onClick={() => setShowAdminPanel(true)}
              data-testid="button-admin-panel"
              title={collapsed ? "Admin" : undefined}
              className={cn(
                "flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold font-mono tracking-widest uppercase hover:bg-cyan-500/20 hover:border-cyan-500/60 transition-all",
                collapsed ? "justify-center w-full" : "w-full"
              )}
            >
              <Shield className="w-3.5 h-3.5 shrink-0" />
              {!collapsed && <span>ADMIN</span>}
            </button>
          )}
        </div>
      </aside>

      {showSettingsPanel && <SettingsPanel onClose={() => setShowSettingsPanel(false)} />}
      {showAdminPanel && <AdminPanel onClose={() => setShowAdminPanel(false)} />}
    </>
  );
}
