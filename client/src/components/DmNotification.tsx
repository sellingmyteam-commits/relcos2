import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UsersRound } from "lucide-react";
import { useLocation } from "wouter";
import type { GroupMessage } from "@shared/schema";
import { getDoNotDisturb } from "@/lib/saveSystem";

type ToastItem = { kind: "group"; id: number; from: string; content: string; groupId: number; groupName: string };

function truncateToWords(text: string, wordCount: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= wordCount) return text;
  return words.slice(0, wordCount).join(" ") + "…";
}

export function DmNotification() {
  const [, navigate] = useLocation();
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
    const GROUP_KEY = "group_last_seen_id";

    const poll = async () => {
      const username = localStorage.getItem("chatUsername") || "";
      if (!username) return;

      try {
        const gRes = await fetch(`/api/groups/latest/${encodeURIComponent(username)}`);

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

  const openFromToast = () => {
    if (!toast) return;
    window.dispatchEvent(new CustomEvent("open-sidebar-chat", { detail: { kind: "group", groupId: toast.groupId } }));
    const path = `/chat?group=${toast.groupId}`;
    if (!window.location.pathname.startsWith("/chat")) {
      navigate(path);
    } else {
      window.history.replaceState(null, "", path);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
    dismissToast();
  };

  return (
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
            style={{ boxShadow: "0 0 22px 4px rgba(255,0,193,0.4), 0 0 60px 14px rgba(255,0,193,0.14)" }}
          />
          <div className="relative bg-black/90 backdrop-blur-xl border-2 border-pink-400/70 hover:border-pink-400 rounded-2xl overflow-hidden transition-colors duration-200">
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-pink-400 to-transparent" />
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 bg-pink-400/15 border border-pink-400/30 rounded-lg shrink-0">
                    <UsersRound className="w-4 h-4 text-pink-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] text-pink-400/60 font-mono uppercase tracking-[0.2em] truncate">
                      Group · {toast.groupName}
                    </p>
                    <p className="text-sm font-display font-bold text-pink-400 uppercase tracking-wider leading-none truncate">
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
                <p className="text-[10px] text-pink-400/50 font-mono uppercase tracking-widest">
                  Click to open
                </p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
                  <span className="text-[10px] text-pink-400/60 font-mono">Live</span>
                </div>
              </div>
            </div>
            <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
