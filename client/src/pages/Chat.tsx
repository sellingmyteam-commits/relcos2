import { useState, useEffect, useRef, useCallback } from "react";
import { Layout } from "@/components/Layout";
import { useMessages, useCreateMessage } from "@/hooks/use-messages";
import { useDirectMessages, useCreateDirectMessage, useConversations, useDeleteConversation, useUnreadCounts } from "@/hooks/use-dm";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useOnlineUsers } from "@/hooks/use-online-users";
import {
  Send, User, Loader2, MessageSquare, Mail, Plus, X,
  Globe, Users, Wifi, Ban, Trash2, Hash,
  Shield
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type ActiveView = "global" | string; // string = DM username

function formatDay(date: Date) {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM d, yyyy");
}

function Avatar({ name, size = "sm", online }: { name: string; size?: "sm" | "md" | "lg"; online?: boolean }) {
  const colors = [
    "from-cyan-500 to-blue-600",
    "from-purple-500 to-pink-600",
    "from-green-500 to-emerald-600",
    "from-orange-500 to-red-600",
    "from-yellow-500 to-orange-600",
    "from-indigo-500 to-purple-600",
  ];
  const colorIdx = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
  const sizeClass = size === "lg" ? "w-10 h-10 text-sm" : size === "md" ? "w-8 h-8 text-xs" : "w-7 h-7 text-[10px]";
  const dotSize = size === "lg" ? "w-3 h-3 border-2" : "w-2.5 h-2.5 border-[1.5px]";
  return (
    <div className="relative flex-shrink-0">
      <div className={cn("rounded-full bg-gradient-to-br flex items-center justify-center font-bold text-white", sizeClass, colors[colorIdx])}>
        {name.slice(0, 1).toUpperCase()}
      </div>
      {online !== undefined && (
        <span className={cn(
          "absolute -bottom-0.5 -right-0.5 rounded-full border-card",
          dotSize,
          online ? "bg-green-400 border-[#0a0a14]" : "bg-muted-foreground/40 border-[#0a0a14]"
        )} />
      )}
    </div>
  );
}

function DateDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-4 px-4">
      <div className="flex-1 h-px bg-white/10" />
      <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest">{label}</span>
      <div className="flex-1 h-px bg-white/10" />
    </div>
  );
}

function GlobalMessage({ msg, isMe, isOnline, prevMsg }: {
  msg: { id: number; username: string; content: string; createdAt: string | null };
  isMe: boolean;
  isOnline: boolean;
  prevMsg?: { username: string; createdAt: string | null } | null;
}) {
  const msgDate = new Date(msg.createdAt || new Date());
  const prevDate = prevMsg ? new Date(prevMsg.createdAt || new Date()) : null;
  const isGrouped = prevMsg?.username === msg.username &&
    prevDate && (msgDate.getTime() - prevDate.getTime()) < 5 * 60 * 1000;

  return (
    <motion.div
      key={msg.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={cn("flex gap-3 px-4 py-0.5 group hover:bg-white/[0.02] rounded-lg transition-colors", isGrouped ? "mt-0.5" : "mt-3")}
    >
      {!isGrouped ? (
        <Avatar name={msg.username} size="md" online={isOnline} />
      ) : (
        <div className="w-8 flex-shrink-0 flex items-center justify-center">
          <span className="text-[9px] text-muted-foreground/30 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
            {format(msgDate, "HH:mm")}
          </span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        {!isGrouped && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className={cn("text-sm font-bold", isMe ? "text-secondary" : "text-white")}>
              {msg.username}
            </span>
            <span className="text-[10px] text-muted-foreground/50 font-mono">
              {format(msgDate, "HH:mm")}
            </span>
          </div>
        )}
        <p className="text-sm text-foreground/90 leading-relaxed break-words">{msg.content}</p>
      </div>
    </motion.div>
  );
}

function DMMessage({ msg, isMe, isLast }: {
  msg: { id: number; fromUser: string; content: string; createdAt: string | null; isRead: boolean; readAt: string | null };
  isMe: boolean;
  isLast: boolean;
}) {
  return (
    <div className={cn("flex gap-2.5 px-4 py-0.5 group", isMe ? "flex-row-reverse" : "flex-row")}>
      <div className={cn("flex flex-col min-w-0", isMe ? "items-end" : "items-start", "max-w-[75%]")}>
        <div className={cn(
          "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words shadow-sm",
          isMe
            ? "bg-secondary/20 text-white border border-secondary/25 rounded-tr-sm"
            : "bg-white/8 text-foreground/95 border border-white/10 rounded-tl-sm"
        )}>
          {msg.content}
        </div>
        <div className={cn("flex items-center gap-1 mt-1", isMe ? "flex-row-reverse" : "flex-row")}>
          <span className="text-[9px] text-muted-foreground/40 font-mono">
            {format(new Date(msg.createdAt || new Date()), "HH:mm")}
          </span>
          {isMe && isLast && (
            msg.isRead ? (
              <span className="text-[9px] font-mono text-secondary/70 uppercase tracking-widest">READ</span>
            ) : (
              <span className="text-[9px] font-mono text-muted-foreground/35 uppercase tracking-widest">SENT</span>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default function Chat() {
  const queryClient = useQueryClient();
  const username = localStorage.getItem("chatUsername") || "";
  const dmParam = new URLSearchParams(window.location.search).get("dm") || null;

  const [activeView, setActiveView] = useState<ActiveView>(dmParam || "global");
  const [input, setInput] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [showNewDm, setShowNewDm] = useState(false);
  const [newDmSearch, setNewDmSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const globalScrollRef = useRef<HTMLDivElement>(null);
  const dmScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onlineUsers = useOnlineUsers(username);
  const { data: messages, isLoading: globalLoading } = useMessages();
  const { mutate: sendMessage, isPending: sendingGlobal } = useCreateMessage();
  const { data: conversations } = useConversations(username);
  const { data: dmMessages, isLoading: dmLoading } = useDirectMessages(username, activeView !== "global" ? activeView : "");
  const { mutate: sendDm, isPending: sendingDm } = useCreateDirectMessage();
  const { mutate: deleteConversation } = useDeleteConversation();
  const { data: unreadCounts } = useUnreadCounts(username);
  const { data: allUsers } = useQuery<string[]>({ queryKey: ["/api/users"] });

  const isDm = activeView !== "global";
  const totalUnread = unreadCounts ? Object.values(unreadCounts).reduce((a, b) => a + b, 0) : 0;

  useEffect(() => {
    const checkMuted = async () => {
      const storedId = localStorage.getItem("siteUserId");
      if (!storedId) return;
      try {
        const res = await fetch(`/api/user/status/id/${storedId}`);
        if (res.ok) {
          const data = await res.json();
          setIsMuted(!!data.isMuted);
        }
      } catch {}
    };
    checkMuted();
    const interval = setInterval(checkMuted, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (globalScrollRef.current) {
      globalScrollRef.current.scrollTop = globalScrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (dmScrollRef.current) {
      dmScrollRef.current.scrollTop = dmScrollRef.current.scrollHeight;
    }
  }, [dmMessages]);

  useEffect(() => {
    if (isDm && username) {
      queryClient.invalidateQueries({ queryKey: ["/api/dm/unread", username] });
    }
  }, [activeView, isDm, username]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [activeView]);

  const handleSendGlobal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isMuted) return;
    sendMessage({ username, content: input }, { onSuccess: () => setInput("") });
  };

  const handleSendDm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !isDm) return;
    sendDm(
      { fromUser: username, toUser: activeView, content: input },
      { onSuccess: () => setInput("") }
    );
  };

  const startDm = (user: string) => {
    setActiveView(user);
    setShowNewDm(false);
    setNewDmSearch("");
  };

  const handleDelete = (user: string) => {
    deleteConversation({ username, otherUser: user });
    setDeleteConfirm(null);
    if (activeView === user) setActiveView("global");
  };

  const activeOnline = isDm ? onlineUsers.includes(activeView) : false;
  const filteredUsers = allUsers?.filter(u => u !== username && u.toLowerCase().includes(newDmSearch.toLowerCase())) ?? [];

  return (
    <Layout noContainer>
      <div className="flex h-full">

        {/* ── LEFT SIDEBAR ── */}
        <div className="w-56 flex-shrink-0 flex flex-col bg-[#0d0d18] border-r border-white/10 overflow-hidden">

          {/* Header */}
          <div className="px-4 py-3.5 border-b border-white/10 bg-black/30 flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-secondary/20 border border-secondary/30 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-secondary" />
            </div>
            <span className="font-display font-black text-sm text-white uppercase tracking-wider">RELC.OS</span>
            <span className="ml-auto text-[8px] font-mono text-secondary/60 uppercase tracking-widest">Comms</span>
          </div>

          {/* Channels */}
          <div className="px-3 pt-4 pb-1">
            <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest px-1">Channels</span>
          </div>
          <button
            onClick={() => setActiveView("global")}
            data-testid="button-tab-global"
            className={cn(
              "mx-2 flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all",
              activeView === "global"
                ? "bg-white/10 text-white"
                : "text-muted-foreground hover:text-white hover:bg-white/5"
            )}
          >
            <Hash className={cn("w-4 h-4 flex-shrink-0", activeView === "global" ? "text-secondary" : "text-muted-foreground/60")} />
            <span>global</span>
          </button>

          {/* DMs */}
          <div className="px-3 pt-4 pb-1 flex items-center justify-between">
            <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest px-1">Direct Messages</span>
            <button
              onClick={() => setShowNewDm(!showNewDm)}
              data-testid="button-new-dm"
              className="p-0.5 rounded text-muted-foreground/40 hover:text-white hover:bg-white/10 transition-all"
              title="New DM"
            >
              {showNewDm ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
            </button>
          </div>

          {showNewDm && (
            <div className="mx-2 mb-2">
              <input
                type="text"
                value={newDmSearch}
                onChange={(e) => setNewDmSearch(e.target.value)}
                placeholder="Search users..."
                autoFocus
                data-testid="input-new-dm-recipient"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent/50 transition-all placeholder:text-muted-foreground/40"
              />
              {newDmSearch && (
                <div className="mt-1 bg-card/80 border border-white/10 rounded-lg overflow-hidden shadow-xl max-h-40 overflow-y-auto">
                  {filteredUsers.length === 0 ? (
                    <div className="px-3 py-4 text-center text-[10px] text-muted-foreground/40">No users found</div>
                  ) : (
                    filteredUsers.map(u => (
                      <button
                        key={u}
                        onClick={() => startDm(u)}
                        data-testid={`button-start-dm-${u}`}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left text-white hover:bg-white/10 transition-colors border-b border-white/5 last:border-0"
                      >
                        <Avatar name={u} size="sm" online={onlineUsers.includes(u)} />
                        <span className="truncate font-medium">{u}</span>
                        {onlineUsers.includes(u) && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto min-h-0 pb-2">
            {conversations?.map((user) => {
              const unread = unreadCounts?.[user] ?? 0;
              const isActive = activeView === user;
              const isOnline = onlineUsers.includes(user);
              return (
                <div key={user} className="relative mx-2 group">
                  <button
                    onClick={() => setActiveView(user)}
                    data-testid={`button-dm-conversation-${user}`}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-left",
                      isActive ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white hover:bg-white/5",
                      unread > 0 && !isActive && "bg-accent/5"
                    )}
                  >
                    <Avatar name={user} size="sm" online={isOnline} />
                    <span className={cn("flex-1 text-sm truncate", unread > 0 ? "font-bold text-white" : "font-medium")}>
                      {user}
                    </span>
                    {unread > 0 && !isActive && (
                      <span
                        className="flex-shrink-0 min-w-[18px] h-[18px] rounded-full bg-accent text-[9px] font-bold text-white flex items-center justify-center px-1"
                        data-testid={`badge-unread-${user}`}
                      >
                        {unread}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm(deleteConfirm === user ? null : user); }}
                    data-testid={`button-delete-dm-${user}`}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/15 text-muted-foreground/30 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  {deleteConfirm === user && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-1 mx-1 p-2 rounded-lg bg-[#0d0d18] border border-red-500/25 shadow-2xl flex items-center gap-2">
                      <span className="text-[10px] text-red-400 flex-1">Delete?</span>
                      <button onClick={() => handleDelete(user)} data-testid="button-confirm-delete-dm" className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-[9px] font-bold hover:bg-red-500/30 transition-colors">Yes</button>
                      <button onClick={() => setDeleteConfirm(null)} className="px-2 py-0.5 bg-white/5 text-muted-foreground rounded text-[9px] hover:bg-white/10 transition-colors">No</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Username footer */}
          <div className="px-4 py-3 border-t border-white/10 bg-black/30 flex items-center gap-2.5">
            <Avatar name={username || "?"} size="sm" online={true} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{username || "Anonymous"}</p>
              <p className="text-[9px] text-green-400 font-mono">● Online</p>
            </div>
          </div>
        </div>

        {/* ── MAIN MESSAGES AREA ── */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0f0f1a]">

          {/* Channel/DM header */}
          <div className="px-5 py-3 border-b border-white/10 bg-black/20 flex items-center gap-3 flex-shrink-0">
            {isDm ? (
              <>
                <Avatar name={activeView} size="md" online={activeOnline} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{activeView}</span>
                    <span className={cn("text-[9px] font-mono", activeOnline ? "text-green-400" : "text-muted-foreground/50")}>
                      {activeOnline ? "● ONLINE" : "○ OFFLINE"}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground/50 font-mono">Direct Message</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-[9px] font-mono text-accent/50 uppercase tracking-wider border border-accent/20 px-2 py-0.5 rounded-full">
                    PRIVATE CHANNEL
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                  <Hash className="w-4 h-4 text-secondary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">global</span>
                    <span className="text-[9px] font-mono text-green-400">● {onlineUsers.length} online</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground/50 font-mono">Everyone can see these messages</p>
                </div>
                <div className="ml-auto hidden md:flex items-center gap-2">
                  <div className="bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg">
                    <p className="text-[9px] text-red-400 font-mono uppercase tracking-wider">
                      I.T may be watching — stay safe
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Messages list */}
          <div
            ref={isDm ? dmScrollRef : globalScrollRef}
            className="flex-1 overflow-y-auto scroll-smooth py-2 relative"
          >
            {isDm ? (
              <>
                {dmLoading ? (
                  <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin text-accent" />
                    <p className="text-xs font-mono animate-pulse">ESTABLISHING SECURE LINK...</p>
                  </div>
                ) : !dmMessages || dmMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground/40">
                    <div className="w-16 h-16 rounded-full bg-accent/5 border border-accent/15 flex items-center justify-center">
                      <Mail className="w-7 h-7 opacity-30" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-muted-foreground/60">No messages yet</p>
                      <p className="text-[10px] font-mono mt-1">Send a message to start the conversation</p>
                    </div>
                  </div>
                ) : (
                  <div className="py-2 space-y-0.5">
                    {dmMessages.map((msg, idx) => {
                      const isMe = msg.fromUser === username;
                      const isLast = idx === dmMessages.length - 1;
                      const prevMsg = idx > 0 ? dmMessages[idx - 1] : null;
                      const msgDate = new Date(msg.createdAt || new Date());
                      const prevDate = prevMsg ? new Date(prevMsg.createdAt || new Date()) : null;
                      const showDivider = !prevDate || formatDay(msgDate) !== formatDay(prevDate);
                      return (
                        <div key={msg.id}>
                          {showDivider && <DateDivider label={formatDay(msgDate)} />}
                          <DMMessage msg={msg} isMe={isMe} isLast={isLast} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <>
                {isMuted && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center backdrop-blur-md bg-black/60">
                    <div className="flex flex-col items-center gap-4 px-8 text-center">
                      <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                        <Ban className="w-8 h-8 text-red-500" />
                      </div>
                      <p className="text-red-500 font-display font-black text-xl uppercase tracking-widest">Muted</p>
                      <p className="text-red-400/70 text-xs font-mono max-w-xs">
                        You cannot send messages. Contact an admin if you think this is a mistake.
                      </p>
                    </div>
                  </div>
                )}

                {globalLoading ? (
                  <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin text-secondary" />
                    <p className="text-xs font-mono animate-pulse">ESTABLISHING UPLINK...</p>
                  </div>
                ) : !messages || messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground/40">
                    <div className="w-16 h-16 rounded-full bg-secondary/5 border border-secondary/15 flex items-center justify-center">
                      <MessageSquare className="w-7 h-7 opacity-30" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-muted-foreground/60">No messages yet</p>
                      <p className="text-[10px] font-mono mt-1">Be the first to say something</p>
                    </div>
                  </div>
                ) : (
                  <div className="py-2">
                    <AnimatePresence initial={false}>
                      {messages.map((msg, idx) => {
                        const isMe = msg.username === username;
                        const isOnline = onlineUsers.includes(msg.username);
                        const prevMsg = idx > 0 ? messages[idx - 1] : null;
                        const msgDate = new Date(msg.createdAt || new Date());
                        const prevDate = prevMsg ? new Date(prevMsg.createdAt || new Date()) : null;
                        const showDivider = !prevDate || formatDay(msgDate) !== formatDay(prevDate);
                        return (
                          <div key={msg.id}>
                            {showDivider && <DateDivider label={formatDay(msgDate)} />}
                            <GlobalMessage
                              msg={msg}
                              isMe={isMe}
                              isOnline={isOnline}
                              prevMsg={prevMsg}
                            />
                          </div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Input bar */}
          <div className="px-4 py-3 border-t border-white/10 bg-black/20 flex-shrink-0">
            <form
              onSubmit={isDm ? handleSendDm : handleSendGlobal}
              className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-0.5 focus-within:border-white/25 focus-within:bg-white/8 transition-all"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isDm ? `Message ${activeView}...` : "Message #global..."}
                data-testid="input-chat-message"
                disabled={!isDm && isMuted}
                className="flex-1 bg-transparent py-3.5 text-sm focus:outline-none placeholder:text-muted-foreground/40 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={(isDm ? sendingDm : sendingGlobal) || !input.trim() || (!isDm && isMuted)}
                data-testid="button-send-message"
                className="flex-shrink-0 p-2 bg-secondary/80 text-secondary-foreground rounded-lg hover:bg-secondary disabled:opacity-40 disabled:hover:bg-secondary/80 transition-all shadow-lg shadow-secondary/10"
              >
                {(isDm ? sendingDm : sendingGlobal)
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>
        </div>

        {/* ── RIGHT ONLINE USERS PANEL ── */}
        <div className="w-44 flex-shrink-0 hidden lg:flex flex-col bg-[#0d0d18] border-l border-white/10 overflow-hidden">
          <div className="px-4 py-3.5 border-b border-white/10 bg-black/30 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[9px] font-bold text-green-400 uppercase tracking-widest">Online</span>
            <span className="ml-auto text-[9px] font-mono text-green-400/60">{onlineUsers.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 p-2">
            {onlineUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/30 gap-2">
                <Wifi className="w-6 h-6 opacity-20" />
                <p className="text-[9px] font-mono text-center">No one online</p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {[...new Set(onlineUsers)].map((user) => {
                  const isMe = user === username;
                  return (
                    <motion.button
                      key={user}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      onClick={() => !isMe && startDm(user)}
                      data-testid={`button-online-user-${user}`}
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-all text-left",
                        !isMe && "hover:bg-white/5 cursor-pointer",
                        isMe && "cursor-default"
                      )}
                      title={isMe ? undefined : `Message ${user}`}
                    >
                      <Avatar name={user} size="sm" online={true} />
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-xs font-medium truncate", isMe ? "text-green-400" : "text-white")}>
                          {user}
                        </p>
                        {isMe && <p className="text-[8px] text-green-400/50 font-mono">you</p>}
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>

      </div>
    </Layout>
  );
}
