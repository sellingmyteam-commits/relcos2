import { Link, useLocation } from "wouter";
import { Shield, Users, Maximize2, Search, Box, Egg, Zap, Bike, Circle, Goal, Trophy, Car, Swords, Grid3x3, Heart, Route, Flame, Cctv, MessageSquare, ChevronDown, Crown, Gauge, Bomb, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { getSharedSocket } from "@/lib/socket";
import { Button } from "@/components/ui/button";
import { AdminPanel } from "@/components/AdminPanel";

const navItems = [
  { href: "/", label: "Home", icon: Shield },
  { href: "/geometry-dash", label: "Geometry Dash", icon: Zap },
  { href: "/shellshockers", label: "Shellshockers", icon: Egg },
  { href: "/eaglercraft", label: "Eaglercraft", icon: Box },
  { href: "/motox3m", label: "Moto X3M", icon: Bike },
  { href: "/stickman-merge", label: "Stickman Merge", icon: Users },
  { href: "/slope", label: "Slope", icon: Circle },
  { href: "/retro-bowl", label: "Retro Bowl", icon: Goal },
  { href: "/rocket-soccer", label: "Rocket Soccer", icon: Trophy },
  { href: "/drift-hunters", label: "Drift Hunters", icon: Car },
  { href: "/brawl-stars", label: "Brawl Stars", icon: Swords },
  { href: "/block-blast", label: "Block Blast", icon: Grid3x3 },
  { href: "/bitlife", label: "BitLife", icon: Heart },
  { href: "/escape-road", label: "Escape Road", icon: Route },
  { href: "/super-hot", label: "SuperHot", icon: Flame },
  { href: "/five-nights-at-winstons", label: "Five Nights At Winston's", icon: Cctv },
  { href: "/car-king", label: "Car King", icon: Crown },
  { href: "/drift-boss", label: "Drift Boss", icon: Gauge },
  { href: "/quake3", label: "Quake 3", icon: Bomb },
  { href: "/tomb-of-the-mask", label: "Tomb of the Mask", icon: Layers },
  { href: "/chat", label: "Live Comms", icon: MessageSquare },
];

export function Navigation() {
  const [location, setLocation] = useLocation();
  const [onlineCount, setOnlineCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchOpen]);

  const toggleFullScreen = () => {
    window.dispatchEvent(new CustomEvent('toggle-fullscreen'));
  };

  const filtered = navItems.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isGamePage = location !== "/" && location !== "/chat";

  return (
    <>
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-white/10 h-16">
      <div className="container h-full mx-auto px-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 shrink-0">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer group" data-testid="link-logo">
              <Shield className="w-6 h-6 text-secondary group-hover:scale-110 transition-transform duration-300" />
              <span className="text-lg font-display font-black tracking-tighter text-white group-hover:text-secondary transition-colors duration-300">
                RELC.OS
              </span>
            </div>
          </Link>
          <Link href="/chat">
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-300 group",
              location === "/chat"
                ? "bg-secondary/10 text-secondary"
                : "text-muted-foreground hover:text-white hover:bg-white/5"
            )} data-testid="link-comms">
              <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-display font-bold uppercase tracking-tight">COMMS</span>
            </div>
          </Link>
        </div>

        <div className="relative flex-1 max-w-md" ref={dropdownRef}>
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            data-testid="button-game-search"
            className={cn(
              "w-full flex items-center gap-2 px-4 h-10 rounded-xl border transition-all duration-300 text-sm",
              searchOpen
                ? "border-secondary/50 bg-secondary/5"
                : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
            )}
          >
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground text-left flex-1 truncate">
              {searchOpen ? "" : "Search games..."}
            </span>
            <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-300 shrink-0", searchOpen && "rotate-180")} />
          </button>

          {searchOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
              <div className="p-3 border-b border-white/5">
                <div className="flex items-center gap-2 px-3 h-9 rounded-lg bg-white/5 border border-white/10">
                  <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Type to search..."
                    data-testid="input-game-search"
                    className="bg-transparent text-sm text-white placeholder:text-muted-foreground outline-none w-full"
                  />
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto p-1">
                {filtered.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">No results found</div>
                ) : (
                  filtered.map(({ href, label, icon: Icon }) => {
                    const isActive = location === href;
                    return (
                      <button
                        key={href}
                        data-testid={`link-game-${href.slice(1) || "home"}`}
                        onClick={() => {
                          setLocation(href);
                          setSearchOpen(false);
                          setSearchQuery("");
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200",
                          isActive
                            ? "bg-secondary/10 text-secondary"
                            : "text-muted-foreground hover:bg-white/5 hover:text-white"
                        )}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="text-sm font-medium">{label}</span>
                        {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-secondary" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {isGamePage && (
            <Button
              variant="default"
              size="sm"
              onClick={toggleFullScreen}
              data-testid="button-fullscreen"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-full px-4 h-8 text-xs flex items-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/20"
            >
              <Maximize2 className="w-3 h-3" />
              <span className="hidden sm:inline">FULLSCREEN</span>
            </Button>
          )}

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-secondary">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="font-mono text-[10px] md:text-xs font-bold whitespace-nowrap" data-testid="text-online-count">
              {onlineCount} ONLINE
            </span>
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowAdminPanel(true)}
              data-testid="button-admin-panel"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold font-mono tracking-widest uppercase hover:bg-cyan-500/20 hover:border-cyan-500/60 transition-all"
              title="Open Admin Panel"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ADMIN</span>
            </button>
          )}
        </div>
      </div>
    </nav>

    {showAdminPanel && <AdminPanel onClose={() => setShowAdminPanel(false)} />}
  </>
  );
}
