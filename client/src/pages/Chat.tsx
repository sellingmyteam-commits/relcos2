import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/Layout";
import { useMessages, useSendMessage } from "@/hooks/use-chat";
import { ChatUsernameOverlay } from "@/components/ChatUsernameOverlay";
import { Send, Loader2, Radio, Globe, Palette, X } from "lucide-react";
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

const COLOR_PALETTE = [
  { hex: "#00fff9", from: "#00fff9", to: "#0080ff" },
  { hex: "#ff00aa", from: "#bf5fff", to: "#ff00c1" },
  { hex: "#9b5de5", from: "#7b2fff", to: "#bf5fff" },
  { hex: "#00ffaa", from: "#00ffaa", to: "#00aa55" },
  { hex: "#ffcc00", from: "#ffcc00", to: "#ff6600" },
  { hex: "#ff6600", from: "#ff6600", to: "#ff0040" },
  { hex: "#5566ff", from: "#5566ff", to: "#9900ff" },
  { hex: "#ff2255", from: "#ff0040", to: "#ff6600" },
];

function getGradientForColor(hex: string) {
  const entry = COLOR_PALETTE.find(p => p.hex === hex);
  return entry ? `linear-gradient(135deg, ${entry.from}, ${entry.to})` : `linear-gradient(135deg, ${hex}, ${hex}bb)`;
}

function Avatar({ name, size = "sm", customColor }: { name: string; size?: "sm" | "md" | "lg"; customColor?: string }) {
  const isRelc = name.toLowerCase() === "relc";
  const idx = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  const [from, to] = AVATAR_COLORS[idx];
  const sizeClass = size === "lg" ? "w-10 h-10 text-sm" : size === "md" ? "w-8 h-8 text-xs" : "w-7 h-7 text-[10px]";

  let gradient: string;
  let shadow: string;
  let textColor: string;

  if (customColor) {
    gradient = getGradientForColor(customColor);
    shadow = `0 0 12px ${customColor}99`;
    textColor = "#fff";
  } else if (isRelc) {
    gradient = "linear-gradient(135deg, #7b2fff, #bf5fff)";
    shadow = "0 0 12px rgba(155,93,229,0.9)";
    textColor = "#fff";
  } else {
    gradient = `linear-gradient(135deg, ${from}, ${to})`;
    shadow = `0 0 10px ${from}55`;
    textColor = "#000";
  }

  return (
    <div
      className={cn("rounded-full flex items-center justify-center font-black flex-shrink-0 shadow-lg", sizeClass)}
      style={{ background: gradient, boxShadow: shadow, color: textColor }}
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

function ChatMessage({ msg, isMe, prevMsg, myColor }: {
  msg: Message;
  isMe: boolean;
  prevMsg?: Message | null;
  myColor?: string;
}) {
  const msgDate = new Date(msg.createdAt || new Date());
  const prevDate = prevMsg ? new Date(prevMsg.createdAt || new Date()) : null;
  const isGrouped = prevMsg?.fromUser === msg.fromUser &&
    prevDate && (msgDate.getTime() - prevDate.getTime()) < 5 * 60 * 1000;

  const idx = msg.fromUser.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  const customColor = isMe && myColor ? myColor : undefined;
  const [nameColor] = customColor
    ? [customColor]
    : msg.fromUser.toLowerCase() === "relc"
    ? ["#bf5fff"]
    : AVATAR_COLORS[idx];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18 }}
      className={cn("flex gap-3 px-4 group transition-colors", isGrouped ? "mt-0.5 py-0.5" : "mt-4 py-1")}
    >
      {!isGrouped ? (
        <Avatar name={msg.fromUser} size="md" customColor={customColor} />
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
  const [myColor, setMyColor] = useState<string>(() => localStorage.getItem("chatNameColor") || "");
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!showPicker) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPicker]);

  const handleColorSelect = (hex: string) => {
    setMyColor(hex);
    localStorage.setItem("chatNameColor", hex);
    setShowPicker(false);
  };

  const handleColorReset = () => {
    setMyColor("");
    localStorage.removeItem("chatNameColor");
    setShowPicker(false);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !currentUsername) return;
    sendMessage({ fromUser: currentUsername, content: input }, { onSuccess: () => setInput("") });
  };

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
          myColor={myColor}
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
            <Avatar name={currentUsername} size="sm" customColor={myColor || undefined} />

            <div className="relative shrink-0" ref={pickerRef}>
              <button
                type="button"
                onClick={() => setShowPicker(!showPicker)}
                data-testid="button-color-picker-chat"
                title="Change name colour"
                className="p-1.5 rounded-lg hover:bg-white/5 transition-all"
                style={{ color: myColor || "rgba(255,255,255,0.3)" }}
              >
                <Palette className="w-4 h-4" />
              </button>

              {showPicker && (
                <div
                  className="absolute bottom-full mb-2 left-0 z-50 p-3 rounded-xl shadow-2xl"
                  style={{ background: "#080818", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-2">Name colour</p>
                  <div className="grid grid-cols-4 gap-2">
                    {COLOR_PALETTE.map(({ hex }) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => handleColorSelect(hex)}
                        className="w-7 h-7 rounded-full transition-transform hover:scale-125 active:scale-95"
                        style={{
                          background: hex,
                          boxShadow: myColor === hex ? `0 0 10px ${hex}` : undefined,
                          outline: myColor === hex ? `2px solid ${hex}` : "none",
                          outlineOffset: "2px",
                        }}
                      />
                    ))}
                  </div>
                  {myColor && (
                    <button
                      type="button"
                      onClick={handleColorReset}
                      className="mt-2.5 w-full flex items-center justify-center gap-1 text-[9px] font-mono text-white/30 hover:text-white/60 transition-colors"
                    >
                      <X className="w-2.5 h-2.5" /> reset to default
                    </button>
                  )}
                </div>
              )}
            </div>

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
