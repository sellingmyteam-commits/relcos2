import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, X, MessageSquare } from "lucide-react";
import { useLocation } from "wouter";
import type { DirectMessage } from "@shared/schema";

export function DmNotification() {
  const [notification, setNotification] = useState<DirectMessage | null>(null);
  const [visible, setVisible] = useState(false);
  const [, navigate] = useLocation();

  const dismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => setNotification(null), 300);
  }, []);

  useEffect(() => {
    const lastSeenKey = "dm_last_seen_id";

    const checkForNew = async () => {
      const username = localStorage.getItem("chatUsername") || "";
      if (!username) return;
      try {
        const res = await fetch(`/api/dm/latest/${encodeURIComponent(username)}`);
        if (!res.ok) return;
        const latest: DirectMessage | null = await res.json();
        if (!latest) return;

        const lastSeenId = parseInt(localStorage.getItem(lastSeenKey) || "0", 10);
        if (latest.id > lastSeenId) {
          localStorage.setItem(lastSeenKey, String(latest.id));
          setNotification(latest);
          setVisible(true);
        }
      } catch {}
    };

    checkForNew();
    const intervalId = setInterval(checkForNew, 3000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(dismiss, 8000);
    return () => clearTimeout(timer);
  }, [visible, dismiss]);

  const handleClick = () => {
    dismiss();
    navigate("/chat");
  };

  if (!notification) return null;

  const truncated = notification.content.length > 80
    ? notification.content.slice(0, 80) + "..."
    : notification.content;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 80, scale: 0.85 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 80, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="fixed top-20 right-4 z-[70] w-80 cursor-pointer"
          onClick={handleClick}
          data-testid="dm-notification"
        >
          {/* Outer glow ring */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              boxShadow: "0 0 20px 4px rgba(0,255,249,0.35), 0 0 50px 10px rgba(0,255,249,0.12)",
              animation: "edge-glow-h 2s ease-in-out infinite",
            }}
          />

          <div className="relative bg-black/90 backdrop-blur-xl border-2 border-cyan-400/70 rounded-2xl overflow-hidden hover:border-cyan-400 transition-colors duration-200">

            {/* Cyan top bar */}
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

            <div className="px-5 py-4">
              {/* Header row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-cyan-400/15 border border-cyan-400/30 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-cyan-400/60 font-mono uppercase tracking-[0.2em]">New Message</p>
                    <p className="text-base font-display font-bold text-cyan-400 uppercase tracking-wider leading-none">
                      {notification.fromUser}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); dismiss(); }}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-500 hover:text-white"
                  data-testid="button-dismiss-notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Message preview */}
              <p className="text-sm text-white/85 font-mono leading-relaxed bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                {truncated}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between mt-3">
                <p className="text-[10px] text-cyan-400/50 font-mono uppercase tracking-widest">
                  Click to open DMs
                </p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-[10px] text-cyan-400/60 font-mono">Live</span>
                </div>
              </div>
            </div>

            {/* Pink bottom bar */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-pink-500/50 to-transparent" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
