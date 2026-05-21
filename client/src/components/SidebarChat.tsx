import { useState, useEffect, useRef } from "react";
import { useMessages, useSendMessage } from "@/hooks/use-chat";
import { Send, Loader2, PanelRightClose, PanelRightOpen, Globe, Wifi } from "lucide-react";
import { useOnlineCount } from "@/hooks/useOnlineCount";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { ChatUsernameOverlay } from "@/components/ChatUsernameOverlay";
import { cn } from "@/lib/utils";

const AVATAR_COLORS = [
  ["#00fff9", "#0080ff"],
  ["#bf5fff", "#ff00c1"],
  ["#00ffaa", "#00aa55"],
  ["#ff6600", "#ff0040"],
  ["#ffcc00", "#ff6600"],
  ["#5566ff", "#9900ff"],
];

function MiniAvatar({ name }: { name: string }) {
  const idx = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  const [from, to] = AVATAR_COLORS[idx];
  return (
    <div
      className="w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] text-black flex-shrink-0 mt-0.5"
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function GlobalChatView({ username }: { username: string }) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useMessages();
  const { mutate: sendMsg, isPending } = useSendMessage();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMsg({ fromUser: username, content: input }, { onSuccess: () => setInput("") });
  };

  return (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-2 py-2 space-y-2.5 scroll-smooth min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-4 h-4 animate-spin text-cyan-400/40" />
          </div>
        ) : messages && messages.length > 0 ? (
          messages.map((msg) => {
            const isMe = msg.fromUser === username;
            const idx = msg.fromUser.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
            const [nameColor] = AVATAR_COLORS[idx];
            return (
              <div key={msg.id} className="flex gap-2 items-start px-1.5 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors group">
                <MiniAvatar name={msg.fromUser} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-xs font-bold leading-none" style={{ color: nameColor }}>{msg.fromUser}</span>
                    <span className="text-[10px] text-white/30 font-mono leading-none">
                      {format(new Date(msg.createdAt || new Date()), "h:mm a")}
                    </span>
                  </div>
                  <p className={cn("text-[12px] leading-relaxed break-words", isMe ? "text-white/90" : "text-white/70")}>
                    {msg.content}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-white/20 gap-2">
            <Globe className="w-6 h-6 opacity-30" />
            <p className="text-[10px] font-mono">No messages yet</p>
          </div>
        )}
      </div>

      <div className="p-2 border-t border-white/10 bg-background/50">
        <form onSubmit={handleSend} className="relative flex items-center gap-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message everyone..."
            data-testid="input-sidebar-message"
            maxLength={2000}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 pr-9 text-xs focus:outline-none focus:border-cyan-500/40 transition-all text-white/85 placeholder:text-white/20"
          />
          <button
            type="submit"
            disabled={isPending || !input.trim()}
            data-testid="button-sidebar-send"
            className="absolute right-1.5 p-1.5 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-md hover:bg-cyan-500/30 disabled:opacity-40 transition-all"
          >
            {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
          </button>
        </form>
      </div>
    </>
  );
}

export function SidebarChat() {
  const [isVisible, setIsVisible] = useState(true);
  const [username, setUsername] = useState(() => localStorage.getItem("chatUsername") || "");
  const onlineCount = useOnlineCount();

  return (
    <div className="relative flex h-full">
      <button
        className="absolute -left-10 top-3 z-20 flex items-center gap-1 px-2 py-1.5 rounded-lg border border-white/10 bg-background/95 backdrop-blur-md shadow-xl hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all duration-300 group"
        onClick={() => setIsVisible(!isVisible)}
        data-testid="button-toggle-chat"
        title={isVisible ? "Hide chat" : "Show chat"}
      >
        {isVisible
          ? <PanelRightClose className="w-4 h-4 text-muted-foreground group-hover:text-cyan-400 transition-colors" />
          : <PanelRightOpen className="w-4 h-4 text-muted-foreground group-hover:text-cyan-400 transition-colors" />}
      </button>

      <motion.div
        initial={false}
        animate={{ width: isVisible ? 300 : 0, opacity: isVisible ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex flex-col h-full bg-card/60 backdrop-blur-sm border-l border-white/10 shadow-2xl overflow-hidden relative"
      >
        {isVisible && !username && (
          <ChatUsernameOverlay onComplete={(name) => setUsername(name)} />
        )}

        {/* Header */}
        <div className="p-3 border-b border-white/10 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Globe className="w-3 h-3 text-cyan-400" />
            </div>
            <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-cyan-400">Global Chat</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20" data-testid="badge-sidebar-online">
              <Wifi className="w-2.5 h-2.5 text-green-400" />
              <span className="text-[10px] font-mono font-bold text-green-400">{onlineCount}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-background/50 border border-white/10 rounded-full px-2.5 py-1 opacity-70">
              <span className="text-[10px] font-mono text-white/60">{username || "Anon"}</span>
            </div>
          </div>
        </div>

        {username
          ? <GlobalChatView username={username} />
          : (
            <div className="flex-1 flex flex-col items-center justify-center text-white/30 gap-2 p-4">
              <Globe className="w-8 h-8 opacity-20" />
              <p className="text-[10px] text-center font-mono">Set a username to chat</p>
            </div>
          )
        }
      </motion.div>
    </div>
  );
}
