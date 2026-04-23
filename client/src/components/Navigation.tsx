import { Link, useLocation } from "wouter";
import { Shield, Maximize2, Search, Settings, MessageSquare, ChevronLeft, ChevronRight, X, Radio, Gamepad2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { getSharedSocket } from "@/lib/socket";
import { Button } from "@/components/ui/button";
import { AdminPanel } from "@/components/AdminPanel";
import { SettingsPanel } from "@/components/SettingsPanel";
import { ALL_GAMES } from "@/lib/games";

export function Navigation() {
  const [location, setLocation] = useLocation();
  const [onlineCount, setOnlineCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [favourites, setFavourites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("favouriteGames") || "[]");
    } catch {
      return [];
    }
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const reload = () => {
      try {
        setFavourites(JSON.parse(localStorage.getItem("favouriteGames") || "[]"));
      } catch {
        setFavourites([]);
      }
    };
    window.addEventListener("storage", reload);
    window.addEventListener("favourites-updated", reload);
    return () => {
      window.removeEventListener("storage", reload);
      window.removeEventListener("favourites-updated", reload);
    };
  }, []);

  const isGamePage = location !== "/" && location !== "/chat" && location !== "/admin";

  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-width", collapsed ? "56px" : "224px");
  }, [collapsed]);

  useEffect(() => {
    if (isGamePage) {
      setCollapsed(true);
    }
  }, [isGamePage]);

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
  const favSet = new Set(favourites);
  const sorted = [
    ...favourites
      .map(href => filtered.find(g => g.href === href))
      .filter((g): g is typeof ALL_GAMES[number] => !!g),
    ...filtered.filter(g => !favSet.has(g.href)),
  ];

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

        {/* Live Comms */}
        <div className={cn("px-2 pt-2 shrink-0", collapsed ? "flex justify-center" : "")}>
          <button
            onClick={() => setLocation("/chat")}
            data-testid="button-live-comms"
            title={collapsed ? "Live Comms" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-lg border transition-all duration-200",
              "bg-gradient-to-r from-pink-500/15 to-cyan-500/15 border-pink-500/30 hover:border-pink-400/60 hover:from-pink-500/25 hover:to-cyan-500/25",
              "text-pink-300 hover:text-white",
              collapsed ? "w-9 h-9 justify-center" : "w-full px-2.5 py-2",
              location === "/chat" && "border-pink-400/70 from-pink-500/30 to-cyan-500/30 text-white"
            )}
          >
            <Radio className="w-4 h-4 shrink-0 animate-pulse" />
            {!collapsed && (
              <span className="text-[10px] font-bold font-mono tracking-widest uppercase">Live Comms</span>
            )}
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
          {sorted.map(({ href, label, icon }) => {
            const Icon = (icon as any) ?? Gamepad2;
            const isActive = location === href;
            const isFav = favSet.has(href);
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
                {!collapsed && isFav && (
                  <Star className="ml-auto w-3 h-3 shrink-0 text-yellow-400 fill-yellow-400" />
                )}
                {!collapsed && !isFav && isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-secondary shrink-0" />}
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
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg bg-white/5 border border-white/10",
              collapsed ? "justify-center w-9 h-9 px-0 py-0 flex-col gap-0.5" : "px-2.5 py-1.5"
            )}
            title={collapsed ? `${onlineCount} online` : undefined}
          >
            {collapsed ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
                <span className="font-mono text-[10px] font-bold text-secondary leading-none" data-testid="text-online-count-collapsed">
                  {onlineCount}
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
                <span className="font-mono text-[10px] font-bold text-secondary whitespace-nowrap" data-testid="text-online-count">
                  {onlineCount} ONLINE
                </span>
              </>
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
