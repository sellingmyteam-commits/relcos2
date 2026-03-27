import { useState, useEffect, useRef } from "react";
import { X, RefreshCw, Shield, VolumeX, Volume2, Ban, CheckCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SiteUser {
  id: number;
  username: string;
  status: number;
  isAdmin: boolean;
  isMuted: boolean;
}

interface AdminPanelProps {
  onClose: () => void;
}

export function AdminPanel({ onClose }: AdminPanelProps) {
  const [users, setUsers] = useState<SiteUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) setUsers(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const patch = async (id: number, endpoint: string, body: object) => {
    setSaving(id);
    try {
      const res = await fetch(`/api/admin/users/${id}/${endpoint}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const updated = await res.json();
        setUsers(prev => prev.map(u => u.id === id ? updated : u));
      }
    } finally {
      setSaving(null);
    }
  };

  const toggleBan = (user: SiteUser) =>
    patch(user.id, "status", { status: user.status === 1 ? 0 : 1 });

  const toggleMute = (user: SiteUser) =>
    patch(user.id, "mute", { muted: !user.isMuted });

  const toggleAdmin = (user: SiteUser) =>
    patch(user.id, "admin", { isAdmin: !user.isAdmin });

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-[9990] flex items-start justify-end"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={panelRef}
        className="w-full max-w-md h-full bg-black/95 border-l border-white/10 flex flex-col shadow-2xl"
        style={{ backdropFilter: "blur(20px)" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-cyan-950/20">
          <Shield className="w-5 h-5 text-cyan-400 shrink-0" />
          <span className="text-sm font-mono font-bold text-cyan-400 uppercase tracking-widest flex-1">
            Admin Panel
          </span>
          <button
            onClick={fetchUsers}
            className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-cyan-400 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-white/5">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users..."
            data-testid="input-admin-search"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-cyan-400/40 transition-colors font-mono"
          />
        </div>

        {/* Stats bar */}
        <div className="flex gap-4 px-4 py-2 bg-white/[0.02] border-b border-white/5 text-[10px] font-mono text-white/30 tracking-widest">
          <span>{users.length} USERS</span>
          <span className="text-red-400/60">{users.filter(u => u.status === 0).length} BANNED</span>
          <span className="text-yellow-400/60">{users.filter(u => u.isMuted).length} MUTED</span>
          <span className="text-cyan-400/60">{users.filter(u => u.isAdmin).length} ADMINS</span>
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-white/30 text-xs font-mono tracking-widest animate-pulse">
              LOADING...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-white/20 text-xs font-mono tracking-widest">
              NO USERS FOUND
            </div>
          ) : (
            filtered.map((user) => {
              const isSaving = saving === user.id;
              const isBanned = user.status === 0;
              return (
                <div
                  key={user.id}
                  data-testid={`admin-user-row-${user.id}`}
                  className={cn(
                    "px-4 py-3 border-b border-white/5 transition-colors",
                    isBanned && "bg-red-950/20"
                  )}
                >
                  {/* Username + badges */}
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className={cn(
                      "text-sm font-mono font-bold truncate flex-1",
                      isBanned ? "text-red-400/70 line-through" : "text-white/90"
                    )}>
                      {user.username}
                    </span>
                    <span className="text-[9px] text-white/20 font-mono">#{user.id}</span>
                    {isBanned && (
                      <span className="text-[9px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded font-mono tracking-wider">
                        BANNED
                      </span>
                    )}
                    {user.isMuted && (
                      <span className="text-[9px] font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-1.5 py-0.5 rounded font-mono tracking-wider">
                        MUTED
                      </span>
                    )}
                    {user.isAdmin && (
                      <span className="text-[9px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded font-mono tracking-wider">
                        ADMIN
                      </span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    {/* Ban/Unban */}
                    <button
                      onClick={() => toggleBan(user)}
                      disabled={isSaving}
                      data-testid={`button-admin-ban-${user.id}`}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] font-bold font-mono tracking-wider border transition-all disabled:opacity-40",
                        isBanned
                          ? "border-green-500/30 text-green-400 hover:bg-green-500/10 hover:border-green-500/60"
                          : "border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/60"
                      )}
                    >
                      {isBanned
                        ? <><CheckCircle className="w-3 h-3" /> UNBAN</>
                        : <><Ban className="w-3 h-3" /> BAN</>
                      }
                    </button>

                    {/* Mute/Unmute */}
                    <button
                      onClick={() => toggleMute(user)}
                      disabled={isSaving}
                      data-testid={`button-admin-mute-${user.id}`}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] font-bold font-mono tracking-wider border transition-all disabled:opacity-40",
                        user.isMuted
                          ? "border-green-500/30 text-green-400 hover:bg-green-500/10 hover:border-green-500/60"
                          : "border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 hover:border-yellow-500/60"
                      )}
                    >
                      {user.isMuted
                        ? <><Volume2 className="w-3 h-3" /> UNMUTE</>
                        : <><VolumeX className="w-3 h-3" /> MUTE</>
                      }
                    </button>

                    {/* Admin toggle */}
                    <button
                      onClick={() => toggleAdmin(user)}
                      disabled={isSaving}
                      data-testid={`button-admin-toggle-${user.id}`}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] font-bold font-mono tracking-wider border transition-all disabled:opacity-40 ml-auto",
                        user.isAdmin
                          ? "border-cyan-500/30 text-cyan-400 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400"
                          : "border-white/10 text-white/30 hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:text-cyan-400"
                      )}
                      title={user.isAdmin ? "Revoke admin" : "Grant admin"}
                    >
                      <Shield className="w-3 h-3" />
                      {user.isAdmin ? "REVOKE" : "ADMIN"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/10 bg-white/[0.02]">
          <p className="text-[9px] font-mono text-white/20 tracking-widest text-center">
            ADMIN ACTIONS ARE INSTANT · AUTO-ENFORCED SERVER-SIDE
          </p>
        </div>
      </div>
    </div>
  );
}
