import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, X, MessageSquare, UsersRound } from "lucide-react";
import { useLocation } from "wouter";
import type { DirectMessage, GroupMessage } from "@shared/schema";
import { getDoNotDisturb } from "@/lib/saveSystem";

type ToastItem =
  | { kind: "dm"; id: number; from: string; content: string }
  | { kind: "group"; id: number; from: string; content: string; groupId: number; groupName: string };

function truncateToWords(text: string, wordCount: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= wordCount) return text;
  return words.slice(0, wordCount).join(" ") + "…";
}

export function DmNotification() {
  const [, navigate] = useLocation();

  const [offlineVisible, setOfflineVisible] = useState(false);
  const [offlineSummary, setOfflineSummary] = useState<{ total: number; senders: string[] } | null>(null);

  const [toast, setToast] = useState<ToastItem | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissToast = useCallback(() => {
    setToast(null);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (getDoNotDisturb()) return;
    const SESSION_KEY = "dm_offline_popup_shown";
    if (sessionStorage.getItem(SESSION_KEY)) return;
    const username = localStorage.getItem("chatUsername") || "";
    if (!username) return;

    (async () => {
      try {
        const res = await fetch(`/api/dm/unread/${encodeURIComponent(username)}`);
        if (!res.ok) return;
        const counts: Record<string, number> = await res.json();
        const senders = Object.keys(counts).filter(k => counts[k] > 0);
        const total = senders.reduce((acc, k) => acc + counts[k], 0);
        if (total > 0) {
          setOfflineSummary({ total, senders });
          setOfflineVisible(true);
          sessionStorage.setItem(SESSION_KEY, "1");
        }
      } catch {}
    })();
  }, []);

  // Poll for new DMs and group messages
  useEffect(() => {
    const DM_KEY = "dm_last_seen_id";
    const GROUP_KEY = "group_last_seen_id";

    const poll = async () => {
      const username = localStorage.getItem("chatUsername") || "";
      if (!username) return;

      try {
        const [dmRes, gRes] = await Promise.all([
          fetch(`/api/dm/latest/${encodeURIComponent(username)}`),
          fetch(`/api/groups/latest/${encodeURIComponent(username)}`),
        ]);

        if (dmRes.ok) {
          const latest: DirectMessage | null = await dmRes.json();
          if (latest) {
            const lastSeen = parseInt(localStorage.getItem(DM_KEY) || "0", 10);
            if (latest.id > lastSeen) {
              localStorage.setItem(DM_KEY, String(latest.id));
              if (lastSeen > 0 && latest.fromUser !== username && !getDoNotDisturb()) {
                setToast({ kind: "dm", id: latest.id, from: latest.fromUser, content: latest.content });
              }
            }
          }
        }

        if (gRes.ok) {
          const latest: (GroupMessage & { groupName: string }) | null = await gRes.json();
          if (latest) {
            const lastSeen = parseInt(localStorage.getItem(GROUP_KEY) || "0", 10);
            if (latest.id > lastSeen) {
              localStorage.setItem(GROUP_KEY, String(latest.id));
              if (lastSeen > 0 && latest.fromUser !== username && !getDoNotDisturb()) {
                setToast({
                  kind: "group",
                  id: latest.id,
                  from: latest.fromUser,
                  content: latest.content,
                  groupId: latest.groupId,
                  groupName: latest.groupName,
                });
              }
            }
          }
        }
      } catch {}
    };

    poll();
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!toast) return;
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 9000);
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [toast]);

  const dismissOffline = () => setOfflineVisible(false);

  const goToDMs = async () => {
    dismissOffline();
    if (offlineSummary) {
      const username = localStorage.getItem("chatUsername") || "";
      for (const sender of offlineSummary.senders) {
        try {
          await fetch("/api/dm/read", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ currentUser: username, otherUser: sender }),
          });
        } catch {}
      }
    }
    navigate("/chat");
  };

  const openFromToast = () => {
    if (!toast) return;
    // If on /games or anywhere with sidebar chat, open that pane.
    // Always also navigate to the chat page in case the sidebar isn't mounted.
    if (toast.kind === "dm") {
      window.dispatchEvent(new CustomEvent("open-sidebar-chat", { detail: { kind: "dm", user: toast.from } }));
    } else {
      window.dispatchEvent(new CustomEvent("open-sidebar-chat", { detail: { kind: "group", groupId: toast.groupId } }));
    }
    const path = toast.kind === "dm"
      ? `/chat?dm=${encodeURIComponent(toast.from)}`
      : `/chat?group=${toast.groupId}`;
    // Only navigate if not already on chat page
    if (!window.location.pathname.startsWith("/chat")) {
      navigate(path);
    } else {
      // Update query string so Chat picks up new selection
      window.history.replaceState(null, "", path);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
    dismissToast();
  };

  const offlineMessage = offlineSummary
    ? offlineSummary.senders.length === 1
      ? `${offlineSummary.senders[0]} messaged you ${offlineSummary.total} time${offlineSummary.total !== 1 ? "s" : ""} while you were offline`
      : `You have ${offlineSummary.total} unread message${offlineSummary.total !== 1 ? "s" : ""} from ${offlineSummary.senders.length} people`
    : "";

  const isGroup = toast?.kind === "group";
  const accentRGB = isGroup ? "255,0,193" : "0,255,249";
  const accentText = isGroup ? "text-pink-400" : "text-cyan-400";
  const accentBorder = isGroup ? "border-pink-400/70 hover:border-pink-400" : "border-cyan-400/70 hover:border-cyan-400";
  const accentBg = isGroup ? "bg-pink-400/15 border-pink-400/30" : "bg-cyan-400/15 border-cyan-400/30";
  const accentGradient = isGroup ? "from-transparent via-pink-400 to-transparent" : "from-transparent via-cyan-400 to-transparent";
  const accentGradientAlt = isGroup ? "from-transparent via-cyan-400/50 to-transparent" : "from-transparent via-pink-500/50 to-transparent";
  const accentTextDim = isGroup ? "text-pink-400/60" : "text-cyan-400/60";
  const accentTextDimmer = isGroup ? "text-pink-400/50" : "text-cyan-400/50";

  return (
    <>
      {/* ── Live corner toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, x: 80, scale: 0.85 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="fixed top-20 right-4 z-[70] w-[22rem] cursor-pointer"
            onClick={openFromToast}
            data-testid="dm-toast-notification"
          >
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                boxShadow: `0 0 22px 4px rgba(${accentRGB},0.4), 0 0 60px 14px rgba(${accentRGB},0.14)`,
              }}
            />
            <div className={`relative bg-black/90 backdrop-blur-xl border-2 ${accentBorder} rounded-2xl overflow-hidden transition-colors duration-200`}>
              <div className={`h-1 w-full bg-gradient-to-r ${accentGradient}`} />
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-1.5 ${accentBg} rounded-lg shrink-0`}>
                      {isGroup
                        ? <UsersRound className={`w-4 h-4 ${accentText}`} />
                        : <MessageSquare className={`w-4 h-4 ${accentText}`} />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className={`text-[9px] ${accentTextDim} font-mono uppercase tracking-[0.2em] truncate`}>
                        {isGroup ? `Group · ${(toast as any).groupName}` : "Direct Message"}
                      </p>
                      <p className={`text-sm font-display font-bold ${accentText} uppercase tracking-wider leading-none truncate`}>
                        {toast.from}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); dismissToast(); }}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-500 hover:text-white shrink-0"
                    data-testid="button-dismiss-dm-toast"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-white/85 font-mono leading-relaxed bg-white/5 border border-white/10 rounded-lg px-3 py-2" data-testid="text-dm-toast-preview">
                  {truncateToWords(toast.content, 12)}
                </p>
                <div className="flex items-center justify-between mt-2.5">
                  <p className={`text-[10px] ${accentTextDimmer} font-mono uppercase tracking-widest`}>
                    Click to open
                  </p>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${isGroup ? "bg-pink-400" : "bg-cyan-400"} animate-pulse`} />
                    <span className={`text-[10px] ${accentTextDim} font-mono`}>Live</span>
                  </div>
                </div>
              </div>
              <div className={`h-px w-full bg-gradient-to-r ${accentGradientAlt}`} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Session-once offline popup ── */}
      <AnimatePresence>
        {offlineVisible && offlineSummary && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
              onClick={dismissOffline}
              data-testid="dm-offline-overlay"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className="fixed inset-0 z-[81] flex items-center justify-center pointer-events-none"
            >
              <div className="pointer-events-auto w-full max-w-sm mx-4 relative" data-testid="dm-offline-popup">
                <div
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  style={{ boxShadow: "0 0 20px 4px rgba(0,255,249,0.25), 0 0 60px 15px rgba(0,255,249,0.08)" }}
                />
                <div className="relative bg-black/95 backdrop-blur-xl border-2 border-cyan-400/60 rounded-2xl overflow-hidden">
                  <div className="h-1 w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
                  <div className="px-6 py-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-cyan-400/15 border border-cyan-400/30 rounded-xl">
                          <MessageSquare className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                          <p className="text-[9px] text-cyan-400/60 font-mono uppercase tracking-[0.2em]">Missed Messages</p>
                          <p className="text-sm font-display font-bold text-cyan-400 uppercase tracking-wider">Direct Messages</p>
                        </div>
                      </div>
                      <button
                        onClick={dismissOffline}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-500 hover:text-white"
                        data-testid="button-dm-popup-dismiss-x"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-5">
                      <p className="text-sm text-white/90 leading-relaxed" data-testid="text-dm-offline-summary">
                        {offlineMessage}
                      </p>
                      {offlineSummary.senders.length > 1 && (
                        <p className="text-[10px] text-cyan-400/60 font-mono mt-1.5">
                          From: {offlineSummary.senders.join(", ")}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={goToDMs}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-cyan-400/15 border border-cyan-400/40 rounded-xl text-cyan-400 text-sm font-bold hover:bg-cyan-400/25 transition-colors"
                        data-testid="button-dm-popup-go"
                      >
                        <Mail className="w-4 h-4" />
                        Go To DMs
                      </button>
                      <button
                        onClick={dismissOffline}
                        className="flex-1 py-2.5 bg-white/5 border border-white/10 rounded-xl text-muted-foreground text-sm font-medium hover:bg-white/10 hover:text-white transition-colors"
                        data-testid="button-dm-popup-dismiss"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-pink-500/40 to-transparent" />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
