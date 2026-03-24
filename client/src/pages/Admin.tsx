import { useState, useEffect, useRef } from "react";
import { Shield, RefreshCw } from "lucide-react";

interface SiteUser {
  id: number;
  username: string;
  status: number;
}

export default function Admin() {
  const [users, setUsers] = useState<SiteUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (editingId !== null && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingId]);

  const startEdit = (user: SiteUser) => {
    setEditingId(user.id);
    setEditValue(user.username);
  };

  const saveUsername = async (id: number) => {
    const trimmed = editValue.trim();
    if (!trimmed || !/^[a-zA-Z0-9_]+$/.test(trimmed) || trimmed.length > 20) {
      setEditingId(null);
      return;
    }
    setSaving(id);
    try {
      const res = await fetch(`/api/admin/users/${id}/username`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmed }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUsers(prev => prev.map(u => u.id === id ? updated : u));
      }
    } finally {
      setSaving(null);
      setEditingId(null);
    }
  };

  const toggleStatus = async (user: SiteUser) => {
    const newStatus = user.status === 1 ? 0 : 1;
    setSaving(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUsers(prev => prev.map(u => u.id === user.id ? updated : u));
      }
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono p-6" style={{ background: "radial-gradient(ellipse at top, #0a0a1a 0%, #000000 100%)" }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-7 h-7 text-cyan-400" />
          <h1 className="text-2xl font-bold tracking-widest uppercase text-cyan-400" style={{ textShadow: "0 0 20px rgba(0,255,249,0.6)" }}>
            ADMIN — USER REGISTRY
          </h1>
          <button
            onClick={fetchUsers}
            className="ml-auto p-2 rounded border border-white/10 hover:border-cyan-400/40 text-white/40 hover:text-cyan-400 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="text-center text-white/40 py-20 tracking-widest animate-pulse">LOADING REGISTRY...</div>
        ) : users.length === 0 ? (
          <div className="text-center text-white/30 py-20 tracking-widest">NO USERS REGISTERED YET</div>
        ) : (
          <div className="border border-white/10 rounded-xl overflow-hidden" style={{ boxShadow: "0 0 40px rgba(0,255,249,0.05)" }}>
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03]">
                  <th className="text-left px-5 py-3 text-[10px] tracking-widest text-white/30 uppercase">ID</th>
                  <th className="text-left px-5 py-3 text-[10px] tracking-widest text-white/30 uppercase">Username</th>
                  <th className="text-left px-5 py-3 text-[10px] tracking-widest text-white/30 uppercase">Status</th>
                  <th className="text-left px-5 py-3 text-[10px] tracking-widest text-white/30 uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => (
                  <tr
                    key={user.id}
                    className={`border-b border-white/5 transition-colors ${user.status === 0 ? "bg-red-950/20" : i % 2 === 0 ? "bg-transparent" : "bg-white/[0.015]"}`}
                  >
                    <td className="px-5 py-4 text-white/30 text-sm">#{user.id}</td>
                    <td className="px-5 py-4">
                      {editingId === user.id ? (
                        <input
                          ref={inputRef}
                          value={editValue}
                          onChange={e => setEditValue(e.target.value.replace(/\s/g, "").slice(0, 20))}
                          onKeyDown={e => {
                            if (e.key === "Enter") saveUsername(user.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          onBlur={() => saveUsername(user.id)}
                          className="bg-black/60 border border-cyan-400/40 rounded px-2 py-1 text-cyan-300 text-sm font-mono outline-none focus:border-cyan-400 w-40"
                          style={{ boxShadow: "0 0 10px rgba(0,255,249,0.15)" }}
                        />
                      ) : (
                        <button
                          onClick={() => startEdit(user)}
                          className={`text-sm hover:text-cyan-300 transition-colors cursor-pointer text-left px-1 rounded hover:bg-white/5 ${user.status === 0 ? "text-red-400/70" : "text-white/80"}`}
                          title="Click to rename"
                        >
                          {user.username}
                          <span className="ml-2 text-[9px] text-white/20 tracking-widest">EDIT</span>
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {user.status === 1 ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-green-400 uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                          ALLOWED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-red-400 uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                          BANNED
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => toggleStatus(user)}
                        disabled={saving === user.id}
                        className={`text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded border transition-all ${
                          saving === user.id
                            ? "opacity-40 cursor-not-allowed border-white/10 text-white/20"
                            : user.status === 1
                            ? "border-red-500/40 text-red-400 hover:bg-red-500/10 hover:border-red-500/70"
                            : "border-green-500/40 text-green-400 hover:bg-green-500/10 hover:border-green-500/70"
                        }`}
                      >
                        {saving === user.id ? "..." : user.status === 1 ? "BAN" : "UNBAN"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-3 bg-white/[0.015] border-t border-white/5 text-[9px] text-white/20 tracking-widest">
              {users.length} USER{users.length !== 1 ? "S" : ""} REGISTERED · AUTO-REFRESH EVERY 5S
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
