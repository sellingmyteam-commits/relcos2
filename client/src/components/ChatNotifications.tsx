import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Message } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare } from "lucide-react";

interface Notif {
  id: number;
  fromUser: string;
  content: string;
}

export function ChatNotifications({ currentUsername }: { currentUsername: string }) {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const lastSeenId = useRef<number>(-1);
  const initialized = useRef(false);

  const { data: messages } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
    refetchInterval: 15000,
  });

  useEffect(() => {
    if (!messages || messages.length === 0) return;

    const maxId = Math.max(...messages.map((m) => m.id));

    if (!initialized.current) {
      lastSeenId.current = maxId;
      initialized.current = true;
      return;
    }

    const incoming = messages.filter(
      (m) => m.id > lastSeenId.current && m.fromUser !== currentUsername
    );

    if (incoming.length > 0) {
      setNotifs((prev) => [
        ...prev,
        ...incoming.map((m) => ({
          id: m.id,
          fromUser: m.fromUser,
          content: m.content.length > 90 ? m.content.slice(0, 90) + "…" : m.content,
        })),
      ]);

      for (const m of incoming) {
        setTimeout(() => {
          setNotifs((prev) => prev.filter((n) => n.id !== m.id));
        }, 5000);
      }
    }

    lastSeenId.current = maxId;
  }, [messages, currentUsername]);

  return (
    <div className="fixed top-4 right-4 z-[9998] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {notifs.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-72 rounded-xl overflow-hidden pointer-events-auto"
            style={{
              background: "rgba(8, 6, 24, 0.95)",
              border: "1px solid rgba(155, 93, 229, 0.35)",
              boxShadow: "0 0 24px rgba(155,93,229,0.15), 0 4px 24px rgba(0,0,0,0.6)",
              backdropFilter: "blur(16px)",
            }}
          >
            {/* Header bar */}
            <div
              className="flex items-center gap-2 px-3 py-1.5"
              style={{
                background: "linear-gradient(90deg, rgba(155,93,229,0.25), rgba(255,0,170,0.15))",
                borderBottom: "1px solid rgba(155,93,229,0.2)",
              }}
            >
              <MessageSquare size={10} style={{ color: "#9b5de5" }} />
              <span
                className="text-[9px] font-mono font-bold tracking-[0.25em] uppercase"
                style={{ color: "#9b5de5" }}
              >
                Global Chat
              </span>
              {/* Pulsing dot */}
              <div className="ml-auto flex items-center gap-1">
                <div
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: "#00ffee", boxShadow: "0 0 6px #00ffee" }}
                />
              </div>
            </div>

            {/* Body */}
            <div className="px-3 py-2.5">
              <div
                className="text-xs font-bold font-display mb-0.5"
                style={{ color: "#ff00aa" }}
              >
                {n.fromUser}
              </div>
              <div className="text-xs leading-relaxed" style={{ color: "rgba(224,247,255,0.85)" }}>
                {n.content}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
