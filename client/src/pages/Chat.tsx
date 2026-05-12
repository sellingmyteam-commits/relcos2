import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/Layout";
import { useMessages, useSendMessage } from "@/hooks/use-chat";
import { ChatUsernameOverlay } from "@/components/ChatUsernameOverlay";
import { Send, Loader2, Radio, Globe } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Message } from "@shared/schema";

function formatDay(date: Date) {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM d, yyyy");
}

const AVATAR_COLORS = [
  ["#00fff9", "#0080ff"],
  ["#bf5fff", "#ff00c1"],
  ["#00ffaa", "#00aa55"],
  ["#ff6600", "#ff0040"],
  ["#ffcc00", "#ff6600"],
  ["#5566ff", "#9900ff"],
];

function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const idx = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  const [from, to] = AVATAR_COLORS[idx];
  const sizeClass = size === "lg" ? "w-10 h-10 text-sm" : size === "md" ? "w-8 h-8 text-xs" : "w-7 h-7 text-[10px]";
  return (
    <div
      className={cn("rounded-full flex items-center justify-center font-black text-black flex-shrink-0 shadow-lg", sizeClass)}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})`, boxShadow: `0 0 10px ${from}55` }}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function DateDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-5 px-5">
      <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(0,255,249,0.2), transparent)" }} />
      <span className="text-[9px] font-mono text-cyan-400/50 uppercase tracking-[0.25em] px-3 py-1 rounded-full border border-cyan-500/15 bg-black/30 backdrop-blur-sm">{label}</span>
      <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(0,255,249,0.2), transparent)" }} />
    </div>
  );
}

function ChatMessage({ msg, isMe, prevMsg }: {
  msg: Message;
  isMe: boolean;
  prevMsg?: Message | null;
}) {
  const msgDate = new Date(msg.createdAt || new Date());
  const prevDate = prevMsg ? new Date(prevMsg.createdAt || new Date()) : null;
  const isGrouped = prevMsg?.fromUser === msg.fromUser &&
    prevDate && (msgDate.getTime() - prevDate.getTime()) < 5 * 60 * 1000;

  const idx = msg.fromUser.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  const [nameColor] = AVATAR_COLORS[idx];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18 }}
      className={cn("flex gap-3 px-4 group transition-colors", isGrouped ? "mt-0.5 py-0.5" : "mt-4 py-1")}
    >
      {!isGrouped ? (
        <Avatar name={msg.fromUser} size="md" />
      ) : (
        <div className="w-8 flex-shrink-0 flex items-end justify-center pb-1">
          <span className="text-[9px] text-white/20 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
            {format(msgDate, "HH:mm")}
          </span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        {!isGrouped && (
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-sm font-black font-display tracking-wide" style={{ color: nameColor, textShadow: `0 0 12px ${nameColor}66` }}>
              {msg.fromUser}
            </span>
            <span className="text-[9px] text-white/25 font-mono">{format(msgDate, "HH:mm")}</span>
          </div>
        )}
        <p className={cn(
          "text-sm leading-relaxed break-words",
          isMe ? "text-white/90" : "text-white/75"
        )}>{msg.content}</p>
      </div>
    </motion.div>
  );
}

export default function Chat() {
  const username = localStorage.getItem("chatUsername") || "";
  const [showOverlay, setShowOverlay] = useState(!username);
  const [currentUsername, setCurrentUsername] = useState(username);
  const [input, setInput] = useState("");
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: msgs, isLoading } = useMessages();
  const { mutate: sendMessage, isPending: sending } = useSendMessage();

  useEffect(() => {
    if (messagesScrollRef.current) {
      messagesScrollRef.current.scrollTop = messagesScrollRef.current.scrollHeight;
    }
  }, [msgs]);

  useEffect(() => { inputRef.current?.focus(); }, [showOverlay]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !currentUsername) return;
    sendMessage({ fromUser: currentUsername, content: input }, { onSuccess: () => setInput("") });
  };

  // Group messages by date for dividers
  const renderMessages = () => {
    if (!msgs || msgs.length === 0) return null;
    const elements: React.ReactNode[] = [];
    let lastDate = "";
    msgs.forEach((msg, i) => {
      const d = new Date(msg.createdAt || new Date());
      const dayLabel = formatDay(d);
      if (dayLabel !== lastDate) {
        elements.push(<DateDivider key={`divider-${i}`} label={dayLabel} />);
        lastDate = dayLabel;
      }
      elements.push(
        <ChatMessage
          key={msg.id}
          msg={msg}
          isMe={msg.fromUser === currentUsername}
          prevMsg={i > 0 ? msgs[i - 1] : null}
        />
      );
    });
    return elements;
  };

  if (showOverlay) {
    return (
      <Layout noContainer>
        <div className="flex h-full items-center justify-center">
          <ChatUsernameOverlay onComplete={(name) => { setCurrentUsername(name); setShowOverlay(false); }} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout noContainer>
      <div className="flex flex-col h-full">

        {/* Header */}
        <div
          className="flex-shrink-0 flex items-center gap-3 px-5 py-3.5"
          style={{
            background: "rgba(2,6,18,0.92)",
            backdropFilter: "blur(24px)",
            borderBottom: "1px solid rgba(0,255,249,0.12)",
          }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,255,249,0.12)", border: "1px solid rgba(0,255,249,0.3)", boxShadow: "0 0 14px rgba(0,255,249,0.2)" }}>
            <Radio className="w-4.5 h-4.5 text-cyan-400" />
          </div>
          <div>
            <p className="text-sm font-display font-black text-white uppercase tracking-widest leading-none">GLOBAL CHAT</p>
            <p className="text-[9px] font-mono text-cyan-400/50 uppercase tracking-[0.2em] mt-0.5">OPEN COMMS · ALL USERS</p>
          </div>
          <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: "rgba(0,255,249,0.06)", border: "1px solid rgba(0,255,249,0.15)" }}>
            <Globe className="w-3 h-3 text-cyan-400/60" />
            <span className="text-[10px] font-mono text-cyan-400/60">chatting as</span>
            <span className="text-[10px] font-mono font-bold text-cyan-300">{currentUsername}</span>
          </div>
        </div>

        {/* Messages area */}
        <div
          ref={messagesScrollRef}
          className="flex-1 overflow-y-auto min-h-0 py-2"
          style={{ background: "rgba(1,4,14,0.6)" }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400/40" />
            </div>
          ) : msgs && msgs.length > 0 ? (
            <AnimatePresence initial={false}>
              {renderMessages()}
            </AnimatePresence>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Globe className="w-10 h-10 text-cyan-400/10" />
              <p className="text-sm text-white/20 font-mono">No messages yet. Say hi!</p>
            </div>
          )}
        </div>

        {/* Input area */}
        <div
          className="flex-shrink-0 px-4 py-3"
          style={{
            background: "rgba(2,6,18,0.92)",
            backdropFilter: "blur(24px)",
            borderTop: "1px solid rgba(0,255,249,0.1)",
          }}
        >
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <Avatar name={currentUsername} size="sm" />
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Message everyone..."
                data-testid="input-global-message"
                maxLength={2000}
                className="w-full rounded-xl px-4 py-2.5 pr-12 text-sm text-white/90 outline-none font-mono placeholder:text-white/20 transition-all"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(0,255,249,0.2)",
                }}
                onFocus={e => e.currentTarget.style.borderColor = "rgba(0,255,249,0.45)"}
                onBlur={e => e.currentTarget.style.borderColor = "rgba(0,255,249,0.2)"}
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                data-testid="button-send-message"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all disabled:opacity-30"
                style={{ background: "rgba(0,255,249,0.15)", border: "1px solid rgba(0,255,249,0.3)" }}
              >
                {sending ? <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" /> : <Send className="w-3.5 h-3.5 text-cyan-400" />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
