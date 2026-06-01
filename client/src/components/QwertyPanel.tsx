import { useState, useEffect, useRef } from "react";
import { X, RefreshCw, Zap } from "lucide-react";
import { getSharedSocket } from "@/lib/socket";
import { cn } from "@/lib/utils";

interface QUser {
  id: number;
  username: string;
  status: number;
}

interface QwertyPanelProps {
  onClose: () => void;
}

export function QwertyPanel({ onClose }: QwertyPanelProps) {
  const [users, setUsers] = useState<QUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [hacking, setHacking] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [glitch, setGlitch] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);
  const myUserId = localStorage.getItem("siteUserId");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const all = await res.json();
        setUsers(all.filter((u: QUser) => String(u.id) !== myUserId));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // Track online users via socket stats_update
  useEffect(() => {
    const socket = getSharedSocket();
    const handler = (stats: { total: number; pages: Record<string, number>; onlineUserIds?: string[] }) => {
      setOnlineUserIds(new Set(stats.onlineUserIds ?? []));
    };
    socket.on("stats_update", handler);
    return () => { socket.off("stats_update", handler); };
  }, []);

  // Random glitch flicker on the panel itself
  useEffect(() => {
    const t = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 80 + Math.random() * 120);
    }, 1800 + Math.random() * 2000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const triggerHack = (user: QUser) => {
    setHacking(user.id);
    const socket = getSharedSocket();
    socket.emit("trigger_qwerty_hack", String(user.id));
    setTimeout(() => setHacking(null), 3000);
  };

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const onlineCount = filtered.filter(u => onlineUserIds.has(String(u.id))).length;

  // Sort: online first, then offline
  const sorted = [
    ...filtered.filter(u => onlineUserIds.has(String(u.id))),
    ...filtered.filter(u => !onlineUserIds.has(String(u.id))),
  ];

  return (
    <div
      className="fixed inset-0 z-[9995] flex items-start justify-end"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={panelRef}
        className="w-full max-w-sm h-full flex flex-col shadow-2xl"
        style={{
          background: "rgba(4, 2, 14, 0.97)",
          borderLeft: "1px solid rgba(255, 0, 60, 0.4)",
          backdropFilter: "blur(20px)",
          transform: glitch ? `translateX(${Math.random() > 0.5 ? 2 : -2}px)` : "none",
          transition: "transform 0.05s",
          boxShadow: "0 0 40px rgba(255,0,60,0.15), inset 0 0 60px rgba(255,0,60,0.03)",
        }}
      >
        {/* Scanline overlay */}
        <div className="absolute inset-0 pointer-events-none z-10" style={{
          background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.08) 0px, rgba(0,0,0,0.08) 1px, transparent 1px, transparent 3px)",
        }} />

        {/* Header */}
        <div
          className="relative z-20 flex items-center gap-3 px-5 py-4 border-b"
          style={{ borderColor: "rgba(255,0,60,0.3)", background: "rgba(255,0,60,0.06)" }}
        >
          <div style={{ animation: "qp-flicker 2s infinite" }}>
            <Zap className="w-5 h-5" style={{ color: "#ff003c", filter: "drop-shadow(0 0 6px #ff003c)" }} />
          </div>
          <span
            className="text-sm font-mono font-black flex-1 tracking-[0.3em] uppercase"
            style={{
              color: "#ff003c",
              textShadow: "0 0 10px #ff003c",
              letterSpacing: glitch ? "0.4em" : "0.3em",
              transition: "letter-spacing 0.05s",
            }}
          >
            Q W E R T Y
          </span>
          <button
            onClick={fetchUsers}
            className="p-1.5 rounded transition-colors"
            style={{ color: "rgba(255,0,60,0.4)" }}
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded transition-colors"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Glitch accent bar */}
        <div className="relative z-20 h-[2px]" style={{
          background: "linear-gradient(90deg, transparent, #ff003c, #00fff9, #ff003c, transparent)",
          animation: "qp-scanbar 2s linear infinite",
          opacity: 0.7,
        }} />

        {/* Search */}
        <div className="relative z-20 px-4 py-3" style={{ borderBottom: "1px solid rgba(255,0,60,0.1)" }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="TARGET SEARCH..."
            className="w-full rounded-lg px-3 py-2 text-sm placeholder:font-mono outline-none font-mono"
            style={{
              background: "rgba(255,0,60,0.05)",
              border: "1px solid rgba(255,0,60,0.25)",
              color: "#ff8080",
              caretColor: "#ff003c",
            }}
          />
        </div>

        {/* Stats */}
        <div className="relative z-20 px-4 py-2 text-[10px] font-mono tracking-widest flex gap-4" style={{
          borderBottom: "1px solid rgba(255,0,60,0.08)",
          color: "rgba(255,0,60,0.4)",
        }}>
          <span>{users.length} TARGETS</span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400" style={{ boxShadow: "0 0 4px #4ade80", animation: "qp-flicker 1.5s infinite" }} />
            <span style={{ color: "rgba(74,222,128,0.7)" }}>{onlineCount} ONLINE</span>
          </span>
        </div>

        {/* User list */}
        <div className="relative z-20 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-[10px] font-mono tracking-widest animate-pulse" style={{ color: "rgba(255,0,60,0.5)" }}>
              SCANNING...
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-[10px] font-mono tracking-widest" style={{ color: "rgba(255,0,60,0.3)" }}>
              NO TARGETS FOUND
            </div>
          ) : (
            sorted.map(user => {
              const isHacking = hacking === user.id;
              const isOnline = onlineUserIds.has(String(user.id));
              return (
                <div
                  key={user.id}
                  className="px-4 py-3"
                  style={{ borderBottom: "1px solid rgba(255,0,60,0.07)" }}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black font-mono"
                        style={{
                          background: isOnline
                            ? "linear-gradient(135deg, #ff003c, #7b0080)"
                            : "linear-gradient(135deg, #3a1a2e, #2a1040)",
                          color: isOnline ? "#fff" : "rgba(255,255,255,0.4)",
                          boxShadow: isOnline ? "0 0 8px rgba(255,0,60,0.4)" : "none",
                        }}
                      >
                        {user.username[0]?.toUpperCase()}
                      </div>
                      {/* Online dot */}
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[rgba(4,2,14,0.97)]"
                        style={{
                          background: isOnline ? "#4ade80" : "rgba(255,255,255,0.12)",
                          boxShadow: isOnline ? "0 0 6px #4ade80" : "none",
                          animation: isOnline ? "qp-flicker 2s infinite" : "none",
                        }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-sm font-mono font-bold truncate"
                          style={{ color: isOnline ? "#ff8080" : "rgba(255,128,128,0.4)" }}
                        >
                          {user.username}
                        </span>
                        <span className="text-[9px] font-mono" style={{ color: "rgba(255,0,60,0.3)" }}>
                          #{user.id}
                        </span>
                      </div>
                      <div className="text-[9px] font-mono mt-0.5" style={{
                        color: isOnline ? "rgba(74,222,128,0.6)" : "rgba(255,255,255,0.15)",
                      }}>
                        {isOnline ? "● ONLINE" : "○ OFFLINE"}
                      </div>
                    </div>

                    {/* HACK button */}
                    <button
                      onClick={() => triggerHack(user)}
                      disabled={isHacking}
                      data-testid={`button-qwerty-hack-${user.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-black font-mono tracking-widest border transition-all disabled:opacity-40"
                      style={{
                        background: isHacking ? "rgba(255,0,60,0.2)" : "rgba(255,0,60,0.08)",
                        borderColor: "rgba(255,0,60,0.5)",
                        color: "#ff003c",
                        textShadow: isHacking ? "0 0 8px #ff003c" : "none",
                        boxShadow: isHacking ? "0 0 12px rgba(255,0,60,0.3)" : "none",
                        animation: isHacking ? "qp-flicker 0.15s infinite" : "none",
                      }}
                    >
                      <Zap className="w-3 h-3" />
                      {isHacking ? "HACKING..." : "HACK"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          className="relative z-20 px-4 py-3"
          style={{ borderTop: "1px solid rgba(255,0,60,0.2)", background: "rgba(255,0,60,0.03)" }}
        >
          <p className="text-[9px] font-mono text-center tracking-widest" style={{ color: "rgba(255,0,60,0.3)" }}>
            QWERTY SYSTEM · UNAUTHORIZED ACCESS PROHIBITED
          </p>
        </div>
      </div>

      <style>{`
        @keyframes qp-flicker {
          0%, 100% { opacity: 1; }
          45%       { opacity: 0.7; }
          50%       { opacity: 0.3; }
          55%       { opacity: 0.9; }
        }
        @keyframes qp-scanbar {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
