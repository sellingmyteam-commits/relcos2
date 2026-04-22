import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UsersRound, Check, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

type Invite = {
  id: number;
  groupId: number;
  groupName: string;
  invitedBy: string;
  createdAt: string | null;
};

export function GroupInviteNotification() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const fetchInvites = async () => {
    const username = localStorage.getItem("chatUsername") || "";
    if (!username) return;
    try {
      const res = await fetch(`/api/groups/invites/${encodeURIComponent(username)}`);
      if (!res.ok) return;
      setInvites(await res.json());
    } catch {}
  };

  useEffect(() => {
    fetchInvites();
    const id = setInterval(fetchInvites, 5000);
    return () => clearInterval(id);
  }, []);

  const accept = async (invite: Invite) => {
    const username = localStorage.getItem("chatUsername") || "";
    if (!username) return;
    setBusyId(invite.id);
    try {
      const res = await fetch(`/api/groups/invites/${invite.id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      if (res.ok) {
        setInvites(prev => prev.filter(i => i.id !== invite.id));
        queryClient.invalidateQueries({ queryKey: ["/api/groups/user", username] });
        window.dispatchEvent(new CustomEvent("open-sidebar-chat", { detail: { kind: "group", groupId: invite.groupId } }));
        if (!window.location.pathname.startsWith("/chat")) {
          navigate(`/chat?group=${invite.groupId}`);
        }
      }
    } finally {
      setBusyId(null);
    }
  };

  const decline = async (invite: Invite) => {
    const username = localStorage.getItem("chatUsername") || "";
    if (!username) return;
    setBusyId(invite.id);
    try {
      const res = await fetch(`/api/groups/invites/${invite.id}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      if (res.ok) setInvites(prev => prev.filter(i => i.id !== invite.id));
    } finally {
      setBusyId(null);
    }
  };

  const top = invites[0];

  return (
    <AnimatePresence>
      {top && (
        <motion.div
          key={top.id}
          initial={{ opacity: 0, x: 80, scale: 0.85 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 80, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="fixed top-40 right-4 z-[71] w-[22rem]"
          data-testid="group-invite-toast"
        >
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ boxShadow: "0 0 22px 4px rgba(168,85,247,0.4), 0 0 60px 14px rgba(168,85,247,0.14)" }}
          />
          <div className="relative bg-black/90 backdrop-blur-xl border-2 border-purple-400/70 rounded-2xl overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-purple-400 to-transparent" />
            <div className="px-5 py-4">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-1.5 bg-purple-400/15 border border-purple-400/30 rounded-lg shrink-0">
                  <UsersRound className="w-4 h-4 text-purple-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] text-purple-400/60 font-mono uppercase tracking-[0.2em] truncate">
                    Group Invite · {invites.length > 1 ? `+${invites.length - 1} more` : "From"} {top.invitedBy}
                  </p>
                  <p className="text-sm font-display font-bold text-purple-300 uppercase tracking-wider leading-none truncate">
                    {top.groupName}
                  </p>
                </div>
              </div>
              <p className="text-xs text-white/80 mb-3 leading-relaxed">
                <span className="text-purple-300 font-bold">{top.invitedBy}</span> invited you to join <span className="text-white font-bold">{top.groupName}</span>.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => accept(top)}
                  disabled={busyId === top.id}
                  data-testid={`button-accept-invite-${top.id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-500/15 border border-green-500/40 rounded-lg text-green-400 text-xs font-bold hover:bg-green-500/25 transition-colors disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  Accept
                </button>
                <button
                  onClick={() => decline(top)}
                  disabled={busyId === top.id}
                  data-testid={`button-decline-invite-${top.id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white/5 border border-white/15 rounded-lg text-muted-foreground text-xs font-bold hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/40 transition-colors disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5" />
                  Decline
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
