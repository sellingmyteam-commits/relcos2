import { useState, useEffect, useRef } from "react";
import { useGroups, useGroupMessages, useSendGroupMessage } from "@/hooks/use-groups";
import { Send, Loader2, PanelRightClose, PanelRightOpen, ArrowLeft, UsersRound } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { ChatUsernameOverlay } from "@/components/ChatUsernameOverlay";
import { cn } from "@/lib/utils";

function SidebarGroupsView({ username, initialGroupId }: { username: string; initialGroupId?: number | null }) {
  const [activeGroupId, setActiveGroupId] = useState<number | null>(initialGroupId ?? null);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialGroupId) setActiveGroupId(initialGroupId);
  }, [initialGroupId]);

  const { data: groups, isLoading: groupsLoading } = useGroups(username);
  const { data: messages, isLoading: msgsLoading } = useGroupMessages(activeGroupId, username);
  const { mutate: sendMsg, isPending } = useSendGroupMessage();

  const activeGroup = groups?.find(g => g.id === activeGroupId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeGroupId]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeGroupId) return;
    sendMsg(
      { groupId: activeGroupId, fromUser: username, content: input },
      { onSuccess: () => setInput("") }
    );
  };

  if (activeGroupId && activeGroup) {
    return (
      <>
        <div className="px-3 py-2 border-b border-white/10 flex items-center gap-2 bg-secondary/5">
          <button onClick={() => setActiveGroupId(null)} className="p-1 rounded hover:bg-white/5 transition-colors" data-testid="button-sidebar-group-back">
            <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <div className="w-5 h-5 rounded-md bg-secondary/10 border border-secondary/30 flex items-center justify-center">
            <UsersRound className="w-2.5 h-2.5 text-secondary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-display font-bold text-white uppercase tracking-tight truncate">{activeGroup.name}</div>
            <div className="text-[8px] text-muted-foreground/60 font-mono truncate">{activeGroup.members.length} members</div>
          </div>
          <span className="text-[8px] text-secondary/60 font-mono">GROUP</span>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 scroll-smooth min-h-0">
          {msgsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-4 h-4 animate-spin text-secondary" />
            </div>
          ) : messages && messages.length > 0 ? (
            messages.map((msg) => {
              const isMe = msg.fromUser === username;
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  <div className="flex items-baseline gap-1.5 mb-0.5">
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${isMe ? "text-secondary" : "text-accent"}`}>
                      {msg.fromUser}
                    </span>
                    <span className="text-[8px] text-muted-foreground font-mono">
                      {format(new Date(msg.createdAt || new Date()), "HH:mm")}
                    </span>
                  </div>
                  <div className={`max-w-[90%] px-2.5 py-1.5 rounded-xl text-[11px] leading-relaxed border ${
                    isMe
                      ? "bg-secondary/10 text-secondary-foreground border-secondary/20 rounded-tr-none"
                      : "bg-white/5 text-foreground border-white/10 rounded-tl-none"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/50 gap-1">
              <UsersRound className="w-6 h-6 opacity-20" />
              <p className="text-[10px]">No messages yet</p>
            </div>
          )}
        </div>

        <div className="p-2 bg-background/50 border-t border-white/10">
          <form onSubmit={handleSend} className="relative flex items-center gap-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Message ${activeGroup.name}...`}
              data-testid="input-sidebar-group-message"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 pr-9 text-xs focus:outline-none focus:border-secondary/50 transition-all"
            />
            <button
              type="submit"
              disabled={isPending || !input.trim()}
              data-testid="button-sidebar-send-group"
              className="absolute right-1.5 p-1.5 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 disabled:opacity-50 transition-all"
            >
              {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            </button>
          </form>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between bg-secondary/5">
        <span className="text-[9px] font-display font-bold text-secondary uppercase tracking-wider">Group Chats</span>
        <span className="text-[8px] text-muted-foreground/50 font-mono">{groups?.length ?? 0}</span>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {groupsLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-4 h-4 animate-spin text-secondary" />
          </div>
        ) : groups && groups.length > 0 ? (
          <div className="p-1.5">
            {groups.map(g => (
              <button
                key={g.id}
                onClick={() => setActiveGroupId(g.id)}
                data-testid={`button-sidebar-group-${g.id}`}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left group"
              >
                <div className="w-6 h-6 rounded-md bg-secondary/10 border border-secondary/20 group-hover:border-secondary/40 flex items-center justify-center transition-colors">
                  <UsersRound className="w-3 h-3 text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white truncate">{g.name}</div>
                  <div className="text-[9px] text-muted-foreground/60 font-mono truncate">
                    {g.members.length} members
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/50 gap-2 px-4 text-center">
            <UsersRound className="w-7 h-7 opacity-15" />
            <p className="text-[10px]">No groups yet</p>
            <p className="text-[8px] font-mono">Create one from the chat page</p>
          </div>
        )}
      </div>
    </>
  );
}

export function SidebarChat() {
  const [isVisible, setIsVisible] = useState(true);
  const [username, setUsername] = useState(() => localStorage.getItem("chatUsername") || "");
  const [pendingGroupId, setPendingGroupId] = useState<number | null>(null);

  useEffect(() => {
    const handleOpenChat = (e: Event) => {
      const detail = (e as CustomEvent<{ kind: "dm" | "group"; user?: string; groupId?: number }>).detail;
      setIsVisible(true);
      if (detail.kind === "group" && detail.groupId) {
        setPendingGroupId(detail.groupId);
      }
    };
    window.addEventListener("open-sidebar-chat", handleOpenChat as EventListener);
    return () => window.removeEventListener("open-sidebar-chat", handleOpenChat as EventListener);
  }, []);

  return (
    <div className="relative flex h-full">
      <button
        className="absolute -left-10 top-3 z-20 flex items-center gap-1 px-2 py-1.5 rounded-lg border border-white/10 bg-background/95 backdrop-blur-md shadow-xl hover:bg-secondary/20 hover:border-secondary/30 transition-all duration-300 group"
        onClick={() => setIsVisible(!isVisible)}
        data-testid="button-toggle-chat"
        title={isVisible ? "Hide chat" : "Show chat"}
      >
        {isVisible
          ? <PanelRightClose className="w-4 h-4 text-muted-foreground group-hover:text-secondary transition-colors" />
          : <PanelRightOpen className="w-4 h-4 text-muted-foreground group-hover:text-secondary transition-colors" />}
      </button>

      <motion.div
        initial={false}
        animate={{ width: isVisible ? 320 : 0, opacity: isVisible ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex flex-col h-full bg-card/60 backdrop-blur-sm border-l border-white/10 shadow-2xl overflow-hidden relative"
      >
        {isVisible && !username && (
          <ChatUsernameOverlay onComplete={(name) => setUsername(name)} />
        )}

        {/* Header */}
        <div className="p-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-secondary/10 border border-secondary/30 flex items-center justify-center">
              <UsersRound className="w-3 h-3 text-secondary" />
            </div>
            <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-secondary">Groups</span>
          </div>
          <div className="flex items-center gap-1.5 bg-background/50 border border-white/10 rounded-full px-2.5 py-1 opacity-70">
            <span className="text-[10px] font-mono text-secondary">{username || "Anon"}</span>
          </div>
        </div>

        {username
          ? <SidebarGroupsView username={username} initialGroupId={pendingGroupId} />
          : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/50 gap-2 p-4">
              <UsersRound className="w-8 h-8 opacity-20" />
              <p className="text-[10px] text-center">Set a username first to use groups</p>
            </div>
          )
        }
      </motion.div>
    </div>
  );
}
