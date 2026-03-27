import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, X, MessageSquare } from "lucide-react";
import { useLocation } from "wouter";
import type { DirectMessage } from "@shared/schema";

function truncateToWords(text: string, wordCount: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= wordCount) return text;
  return words.slice(0, wordCount).join(" ") + "…";
}

export function DmNotification() {
  const [, navigate] = useLocation();

  const [offlineVisible, setOfflineVisible] = useState(false);
  const [offlineSummary, setOfflineSummary] = useState<{ total: number; senders: string[] } | null>(null);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState<DirectMessage | null>(null);
  const toastTimerRef = useState<ReturnType<typeof setTimeout> | null>(null);

  const dismissToast = useCallback(() => {
    setToastVisible(false);
    setTimeout(() => setToastMsg(null), 300);
  }, []);

  useEffect(() => {
    const SESSION_KEY = "dm_offline_popup_shown";
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const username = localStorage.getItem("chatUsername") || "";
    if (!username) return;

    const check = async () => {
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
    };

    check();
  }, []);

  useEffect(() => {
    const LAST_SEEN_KEY = "dm_last_seen_id";

    const poll = async () => {
      const username = localStorage.getItem("chatUsername") || "";
      if (!username) return;
      try {
        const res = await fetch(`/api/dm/latest/${encodeURIComponent(username)}`);
        if (!res.ok) return;
        const latest: DirectMessage | null = await res.json();
        if (!latest) return;

        const lastSeenId = parseInt(localStorage.getItem(LAST_SEEN_KEY) || "0", 10);
        if (latest.id > lastSeenId) {
          localStorage.setItem(LAST_SEEN_KEY, String(latest.id));

          if (lastSeenId > 0) {
            setToastMsg(latest);
            setToastVisible(true);
          }
        }
      } catch {}
    };

    poll();
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!toastVisible) return;
    const t = setTimeout(dismissToast, 8000);
    return () => clearTimeout(t);
  }, [toastVisible, dismissToast]);

  const dismissOffline = () => setOfflineVisible(false);
  const goToDMs = () => {
    dismissOffline();
    navigate("/chat");
  };
  const openDMFromToast = () => {
    dismissToast();
    navigate("/chat");
  };

  const offlineMessage = offlineSummary
    ? offlineSummary.senders.length === 1
      ? `${offlineSummary.senders[0]} messaged you ${offlineSummary.total} time${offlineSummary.total !== 1 ? "s" : ""} while you were offline`
      : `You have ${offlineSummary.total} unread message${offlineSummary.total !== 1 ? "s" : ""} from ${offlineSummary.senders.length} people`
    : "";

  return (
    <>
      {/* ── Live corner toast ── */}
      <AnimatePresence>
        {toastVisible && toastMsg && (
          <motion.div
            initial={{ opacity: 0, x: 80, scale: 0.85 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="fixed top-20 right-4 z-[70] w-80 cursor-pointer"
            onClick={openDMFromToast}
            data-testid="dm-toast-notification"
          >
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                boxShadow: "0 0 20px 4px rgba(0,255,249,0.35), 0 0 50px 10px rgba(0,255,249,0.12)",
              }}
            />
            <div className="relative bg-black/90 backdrop-blur-xl border-2 border-cyan-400/70 rounded-2xl overflow-hidden hover:border-cyan-400 transition-colors duration-200">
              <div className="h-1 w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-cyan-400/15 border border-cyan-400/30 rounded-lg">
                      <MessageSquare className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-[9px] text-cyan-400/60 font-mono uppercase tracking-[0.2em]">Direct Message</p>
                      <p className="text-sm font-display font-bold text-cyan-400 uppercase tracking-wider leading-none">
                        {toastMsg.fromUser}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); dismissToast(); }}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-500 hover:text-white"
                    data-testid="button-dismiss-dm-toast"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-white/85 font-mono leading-relaxed bg-white/5 border border-white/10 rounded-lg px-3 py-2" data-testid="text-dm-toast-preview">
                  {truncateToWords(toastMsg.content, 10)}
                </p>
                <div className="flex items-center justify-between mt-2.5">
                  <p className="text-[10px] text-cyan-400/50 font-mono uppercase tracking-widest">Click to open DMs</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-[10px] text-cyan-400/60 font-mono">Live</span>
                  </div>
                </div>
              </div>
              <div className="h-px w-full bg-gradient-to-r from-transparent via-pink-500/50 to-transparent" />
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
