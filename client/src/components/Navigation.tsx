import { Link, useLocation } from "wouter";
import { Shield, Maximize2, Search, Settings, MessageSquare, ChevronLeft, ChevronRight, X, Gamepad2, Star, Lock, FileCode } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { getSharedSocket } from "@/lib/socket";
import { Button } from "@/components/ui/button";

import { AdminPanel } from "@/components/AdminPanel";
import { SettingsPanel } from "@/components/SettingsPanel";
import { HtmlEmulator } from "@/components/HtmlEmulator";
import { ALL_GAMES } from "@/lib/games";
import { useGameLocks } from "@/hooks/useGameLocks";

export function Navigation() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showHtmlEmulator, setShowHtmlEmulator] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [favourites, setFavourites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("favouriteGames") || "[]");
    } catch {
      return [];
    }
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const { isLocked } = useGameLocks();

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

    const emitPage = () => {
      socket.emit("join_page", location);
    };

    // Emit now if already connected, otherwise the connect handler will fire it
    if (socket.connected) {
      emitPage();
    }

    // Re-emit on connect (covers initial connection) and reconnect (covers drops)
    socket.on("connect", emitPage);
    socket.on("reconnect", emitPage);

    return () => {
      socket.off("connect", emitPage);
      socket.off("reconnect", emitPage);
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
          collapsed ? "w-14" : "w-56"
        )}
        style={{
          background: "rgba(2, 5, 18, 0.82)",
          backdropFilter: "blur(28px) saturate(1.4)",
          borderRight: "1px solid rgba(0, 255, 249, 0.1)",
          boxShadow: "2px 0 32px rgba(0,0,0,0.4)"
        }}
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
          {sorted.map(({ href, label, icon }) => {
            const Icon = (icon as any) ?? Gamepad2;
            const isActive = location === href;
            const isFav = favSet.has(href);
            const locked = isLocked(href);
            return (
              <button
                key={href}
                data-testid={`link-game-${href.slice(1) || "home"}`}
                onClick={() => {
                  setLocation(href);
                  setSearchQuery("");
                }}
                title={collapsed ? `${label}${locked ? " (locked)" : ""}` : undefined}
                className={cn(
                  "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all duration-200 mb-0.5 relative",
                  collapsed ? "justify-center" : "",
                  locked
                    ? "text-red-400/80 hover:bg-red-500/10 hover:text-red-300 border border-red-500/20 bg-red-500/5"
                    : isActive
                      ? "bg-secondary/15 text-secondary border border-secondary/30"
                      : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
              >
                <span className="relative shrink-0">
                  <Icon className={cn("w-4 h-4", isActive && !locked ? "text-secondary" : "", locked && "opacity-60")} />
                  {locked && collapsed && (
                    <Lock className="absolute -bottom-1 -right-1 w-2.5 h-2.5 text-red-400 bg-background rounded-sm" />
                  )}
                </span>
                {!collapsed && (
                  <span className={cn("text-xs font-medium truncate", locked && "line-through decoration-red-500/60")}>
                    {label}
                  </span>
                )}
                {!collapsed && locked && (
                  <Lock className="ml-auto w-3 h-3 shrink-0 text-red-400 animate-pulse" />
                )}
                {!collapsed && !locked && isFav && (
                  <Star className="ml-auto w-3 h-3 shrink-0 text-yellow-400 fill-yellow-400" />
                )}
                {!collapsed && !locked && !isFav && isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-secondary shrink-0" />}
              </button>
            );
          })}
          {filtered.length === 0 && !collapsed && (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">No results found</div>
          )}
        </div>

        {/* Bottom actions */}
        <div className={cn("border-t border-white/10 p-2 flex flex-col gap-1 shrink-0", collapsed ? "items-center" : "")}>
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

          {/* Live Comms */}
          <button
            onClick={() => setLocation("/chat")}
            data-testid="button-live-comms"
            title={collapsed ? "Live Comms" : undefined}
            className={cn(
              "flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-muted-foreground text-[10px] font-bold font-mono tracking-widest uppercase hover:bg-white/10 hover:text-white hover:border-white/20 transition-all",
              collapsed ? "justify-center w-full" : "w-full",
              location === "/chat" && "bg-secondary/10 border-secondary/30 text-secondary"
            )}
          >
            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
            {!collapsed && <span>LIVE COMMS</span>}
          </button>

          {/* HTML Emulator */}
          <button
            onClick={() => setShowHtmlEmulator(true)}
            data-testid="button-html-emulator"
            title={collapsed ? "HTML Emulator" : undefined}
            className={cn(
              "flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold font-mono tracking-widest uppercase transition-all",
              "bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-400 hover:bg-fuchsia-500/20 hover:border-fuchsia-500/60 hover:text-fuchsia-300",
              collapsed ? "justify-center w-full" : "w-full"
            )}
          >
            <FileCode className="w-3.5 h-3.5 shrink-0" />
            {!collapsed && <span>HTML EMULATOR</span>}
          </button>

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
      {showHtmlEmulator && <HtmlEmulator onClose={() => setShowHtmlEmulator(false)} />}
    </>
  );
}
