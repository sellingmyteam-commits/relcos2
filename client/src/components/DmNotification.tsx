import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, X, MessageSquare } from "lucide-react";
import { useLocation } from "wouter";

export function DmNotification() {
  const [visible, setVisible] = useState(false);
  const [summary, setSummary] = useState<{ total: number; senders: string[] } | null>(null);
  const [, navigate] = useLocation();

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
          setSummary({ total, senders });
          setVisible(true);
          sessionStorage.setItem(SESSION_KEY, "1");
        }
      } catch {}
    };

    check();
  }, []);

  const dismiss = () => setVisible(false);

  const goToDMs = () => {
    dismiss();
    navigate("/chat");
  };

  if (!summary) return null;

  const message = summary.senders.length === 1
    ? `${summary.senders[0]} messaged you ${summary.total} time${summary.total !== 1 ? "s" : ""} while you were offline`
    : `You have ${summary.total} unread message${summary.total !== 1 ? "s" : ""} from ${summary.senders.length} people`;

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
            onClick={dismiss}
            data-testid="dm-offline-overlay"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="fixed inset-0 z-[81] flex items-center justify-center pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-sm mx-4 relative"
              data-testid="dm-offline-popup"
            >
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  boxShadow: "0 0 20px 4px rgba(0,255,249,0.25), 0 0 60px 15px rgba(0,255,249,0.08)",
                }}
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
                      onClick={dismiss}
                      className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-500 hover:text-white"
                      data-testid="button-dm-popup-dismiss-x"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-5">
                    <p className="text-sm text-white/90 leading-relaxed" data-testid="text-dm-offline-summary">
                      {message}
                    </p>
                    {summary.senders.length > 1 && (
                      <p className="text-[10px] text-cyan-400/60 font-mono mt-1.5">
                        From: {summary.senders.join(", ")}
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
                      onClick={dismiss}
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
  );
}
