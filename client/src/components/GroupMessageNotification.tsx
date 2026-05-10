import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UsersRound } from "lucide-react";
import { useLocation } from "wouter";
import type { GroupMessage } from "@shared/schema";
import { getDoNotDisturb } from "@/lib/saveSystem";

type ToastItem = { id: number; from: string; content: string; groupId: number; groupName: string };

function truncateToWords(text: string, wordCount: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= wordCount) return text;
  return words.slice(0, wordCount).join(" ") + "…";
}

interface Props {
  username: string;
}

export function GroupMessageNotification({ username }: Props) {
  const [, navigate] = useLocation();
  const [toast, setToast] = useState<ToastItem | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initializedRef = useRef(false);
  const lastSeenRef = useRef<number>(0);
  const usernameRef = useRef(username);

  // Keep usernameRef in sync without restarting the poll loop
  useEffect(() => {
    usernameRef.current = username;
  }, [username]);

  const dismiss = useCallback(() => {
    setToast(null);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    if (!username) return;

    const poll = async () => {
      const user = usernameRef.current;
      if (!user) return;
      try {
        const res = await fetch(`/api/group-latest/${encodeURIComponent(user)}`);
        if (!res.ok) return;
        const latest: (GroupMessage & { groupName: string }) | null = await res.json();

        if (!initializedRef.current) {
          // First poll: silently mark whatever exists as already seen
          lastSeenRef.current = latest ? latest.id : 0;
          initializedRef.current = true;
          console.log("[GroupNotif] initialized, baseline msg id =", lastSeenRef.current);
          return;
        }

        if (!latest) return;
        if (latest.id <= lastSeenRef.current) return;

        // New message arrived
        console.log("[GroupNotif] new msg from", latest.fromUser, "id=", latest.id, "user=", user);
        lastSeenRef.current = latest.id;

        if (latest.fromUser !== user && !getDoNotDisturb()) {
          setToast({
            id: latest.id,
            from: latest.fromUser,
            content: latest.content,
            groupId: latest.groupId,
            groupName: latest.groupName,
          });
        }
      } catch (e) {
        console.error("[GroupNotif] poll error", e);
      }
    };

    // Reset state when username changes (new login)
    initializedRef.current = false;
    lastSeenRef.current = 0;

    poll();
    const id = setInterval(poll, 6000);
    return () => clearInterval(id);
  }, [username]);

  useEffect(() => {
    if (!toast) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(null), 8000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [toast]);

  const open = () => {
    if (!toast) return;
    window.dispatchEvent(new CustomEvent("open-sidebar-chat", { detail: { kind: "group", groupId: toast.groupId } }));
    const path = `/chat?group=${toast.groupId}`;
    if (!window.location.pathname.startsWith("/chat")) {
      navigate(path);
    } else {
      window.history.replaceState(null, "", path);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
    dismiss();
  };

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: -60, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.92 }}
          transition={{ type: "spring", stiffness: 420, damping: 30 }}
          className="fixed top-4 right-4 z-[70] w-[22rem] cursor-pointer"
          onClick={open}
          data-testid="group-message-toast"
        >
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ boxShadow: "0 0 22px 4px rgba(255,0,193,0.35), 0 0 60px 14px rgba(255,0,193,0.12)" }}
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
                  onClick={(e) => { e.stopPropagation(); dismiss(); }}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-500 hover:text-white shrink-0"
                  data-testid="button-dismiss-group-msg-toast"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-white/85 font-mono leading-relaxed bg-white/5 border border-white/10 rounded-lg px-3 py-2" data-testid="text-group-msg-preview">
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
