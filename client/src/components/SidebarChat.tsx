import { useState, useEffect, useRef } from "react";
import { useMessages, useCreateMessage } from "@/hooks/use-messages";
import { useDirectMessages, useCreateDirectMessage, useConversations, useUnreadCounts, useMarkConversationRead, useDeleteConversation } from "@/hooks/use-dm";
import { useOnlineUsers } from "@/hooks/use-online-users";
import { useQuery } from "@tanstack/react-query";
import { Send, User, Loader2, MessageSquare, PanelRightClose, PanelRightOpen, Mail, Globe, ArrowLeft, Plus, X, ChevronDown, Wifi, Trash2, Check, CheckCheck } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { ChatUsernameOverlay } from "@/components/ChatUsernameOverlay";
import { cn } from "@/lib/utils";

type SidebarTab = "global" | "dm" | "online";

function SidebarDMView({ username, initialChat, onUnreadCountChange }: { username: string; initialChat?: string | null; onUnreadCountChange?: (total: number) => void }) {
  const [activeChat, setActiveChat] = useState<string | null>(initialChat ?? null);
  const [newRecipient, setNewRecipient] = useState("");
  const [showNewDm, setShowNewDm] = useState(false);
  const [dmInput, setDmInput] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dmScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialChat) setActiveChat(initialChat);
  }, [initialChat]);

  const { data: conversations, isLoading: convsLoading } = useConversations(username);
  const { data: dmMessages, isLoading: dmsLoading } = useDirectMessages(username, activeChat || "");
  const { mutate: sendDm, isPending: dmPending } = useCreateDirectMessage();
  const { data: unreadCounts } = useUnreadCounts(username);
  const { mutate: markRead } = useMarkConversationRead();
  const { mutate: deleteConv } = useDeleteConversation();

  const { data: allUsers } = useQuery<string[]>({ queryKey: ["/api/users"] });

  const totalUnread = unreadCounts ? Object.values(unreadCounts).reduce((a, b) => a + b, 0) : 0;
  useEffect(() => {
    onUnreadCountChange?.(totalUnread);
  }, [totalUnread, onUnreadCountChange]);

  useEffect(() => {
    if (!activeChat || !username || !dmMessages) return;
    const hasUnread = dmMessages.some(
      (m) => m.fromUser === activeChat && (m.isRead === false || m.isRead === null)
    );
    if (hasUnread) {
      markRead({ currentUser: username, otherUser: activeChat });
    }
  }, [activeChat, username, dmMessages]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.body.addEventListener("mousedown", handleClickOutside);
    return () => document.body.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (dmScrollRef.current) {
      dmScrollRef.current.scrollTop = dmScrollRef.current.scrollHeight;
    }
  }, [dmMessages]);

  const handleSendDm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dmInput.trim() || !activeChat) return;
    sendDm(
      { fromUser: username, toUser: activeChat, content: dmInput },
      { onSuccess: () => setDmInput("") }
    );
  };

  const startNewConversation = () => {
    const recipient = newRecipient.trim();
    if (!recipient || recipient === username) return;
    setActiveChat(recipient);
    setNewRecipient("");
    setShowNewDm(false);
  };

  const handleDeleteConv = (user: string) => {
    deleteConv({ username, otherUser: user });
    setConfirmDelete(null);
    if (activeChat === user) setActiveChat(null);
  };

  if (activeChat) {
    const myMessages = dmMessages?.filter(m => m.fromUser === username) ?? [];
    const lastMyMsg = myMessages.length > 0 ? myMessages[myMessages.length - 1] : null;
    const lastMsg = dmMessages && dmMessages.length > 0 ? dmMessages[dmMessages.length - 1] : null;

    return (
      <>
        <div className="px-3 py-2 border-b border-white/10 flex items-center gap-2 bg-accent/5">
          <button onClick={() => setActiveChat(null)} className="p-1 rounded hover:bg-white/5 transition-colors" data-testid="button-sidebar-dm-back">
            <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <div className="w-5 h-5 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
            <User className="w-2.5 h-2.5 text-accent" />
          </div>
          <span className="text-[10px] font-display font-bold text-white uppercase tracking-tight">{activeChat}</span>
          <span className="text-[8px] text-accent/60 font-mono ml-auto">PRIVATE</span>
          <button
            onClick={() => setConfirmDelete(activeChat)}
            className="p-1 rounded hover:bg-red-500/10 transition-colors text-muted-foreground/40 hover:text-red-400"
            data-testid="button-sidebar-dm-delete"
            title="Delete conversation"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>

        {confirmDelete === activeChat && (
          <div className="mx-3 mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
            <span className="text-[9px] text-red-400 flex-1">Delete this conversation?</span>
            <button
              onClick={() => handleDeleteConv(activeChat)}
              className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-[9px] font-bold hover:bg-red-500/30 transition-colors"
              data-testid="button-sidebar-dm-confirm-delete"
            >
              Delete
            </button>
            <button
              onClick={() => setConfirmDelete(null)}
              className="px-2 py-0.5 bg-white/5 text-muted-foreground rounded text-[9px] hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        <div ref={dmScrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 scroll-smooth min-h-0">
          {dmsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-4 h-4 animate-spin text-accent" />
            </div>
          ) : dmMessages && dmMessages.length > 0 ? (
            dmMessages.map((msg, idx) => {
              const isMe = msg.fromUser === username;
              const isLastMsg = idx === dmMessages.length - 1;
              const isLastMyMsg = isMe && lastMyMsg?.id === msg.id;

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
                      : "bg-accent/10 text-foreground border-accent/20 rounded-tl-none"
                  }`}>
                    {msg.content}
                  </div>
                  {isLastMyMsg && (
                    <div className="flex items-center gap-1 mt-0.5" data-testid={`text-read-receipt-${msg.id}`}>
                      {msg.isRead ? (
                        <>
                          <CheckCheck className="w-2.5 h-2.5 text-accent/60" />
                          <span className="text-[8px] text-accent/60 font-mono">
                            Read{msg.readAt ? ` at ${format(new Date(msg.readAt), "h:mm a")}` : ""}
                          </span>
                        </>
                      ) : (
                        <>
                          <Check className="w-2.5 h-2.5 text-muted-foreground/40" />
                          <span className="text-[8px] text-muted-foreground/40 font-mono">Delivered</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/50 gap-1">
              <Mail className="w-6 h-6 opacity-20" />
              <p className="text-[10px]">No messages yet</p>
            </div>
          )}
        </div>

        <div className="p-2 bg-background/50 border-t border-white/10">
          <form onSubmit={handleSendDm} className="relative flex items-center gap-1">
            <input
              type="text"
              value={dmInput}
              onChange={(e) => setDmInput(e.target.value)}
              placeholder={`Message ${activeChat}...`}
              data-testid="input-sidebar-dm-message"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 pr-9 text-xs focus:outline-none focus:border-accent/50 transition-all"
            />
            <button
              type="submit"
              disabled={dmPending || !dmInput.trim()}
              data-testid="button-sidebar-send-dm"
              className="absolute right-1.5 p-1.5 bg-accent text-accent-foreground rounded-md hover:bg-accent/90 disabled:opacity-50 transition-all"
            >
              {dmPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            </button>
          </form>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between bg-accent/5">
        <span className="text-[9px] font-display font-bold text-accent uppercase tracking-wider">Conversations</span>
        <button
          onClick={() => setShowNewDm(!showNewDm)}
          className="flex items-center gap-1 px-2 py-1 rounded-md bg-accent/10 border border-accent/20 text-accent text-[9px] font-bold hover:bg-accent/20 transition-colors"
          data-testid="button-sidebar-new-dm"
        >
          {showNewDm ? <X className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5" />}
          <span>{showNewDm ? "CANCEL" : "NEW"}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {conversations && conversations.length > 0 && !showNewDm ? (
          <div className="p-1.5">
            {conversations.map((user) => {
              const unread = unreadCounts?.[user] ?? 0;
              return (
                <div key={user} className="relative group flex items-center">
                  <button
                    onClick={() => setActiveChat(user)}
                    data-testid={`button-sidebar-dm-${user}`}
                    className={cn(
                      "flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left",
                      unread > 0 && "bg-accent/5"
                    )}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-full bg-accent/10 border flex items-center justify-center transition-colors",
                      unread > 0 ? "border-accent/60" : "border-accent/20 group-hover:border-accent/40"
                    )}>
                      <User className="w-3 h-3 text-accent" />
                    </div>
                    <span className={cn("text-xs font-medium", unread > 0 ? "text-white font-bold" : "text-white")}>{user}</span>
                    <div className="ml-auto flex items-center gap-1.5">
                      {unread > 0 ? (
                        <span
                          className="min-w-[16px] h-4 rounded-full bg-accent text-accent-foreground text-[8px] font-bold flex items-center justify-center px-1"
                          data-testid={`badge-unread-${user}`}
                        >
                          {unread}
                        </span>
                      ) : (
                        <Mail className="w-3 h-3 text-muted-foreground/20 group-hover:text-accent/40 transition-colors" />
                      )}
                    </div>
                  </button>
                  <button
                    onClick={() => setConfirmDelete(confirmDelete === user ? null : user)}
                    className="absolute right-1 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 transition-all text-muted-foreground/40 hover:text-red-400"
                    data-testid={`button-sidebar-conv-delete-${user}`}
                    title="Delete conversation"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  {confirmDelete === user && (
                    <div className="absolute right-0 top-full z-10 mt-1 p-2 rounded-lg bg-card/95 border border-red-500/20 shadow-xl flex items-center gap-2 whitespace-nowrap">
                      <span className="text-[9px] text-red-400">Delete for you?</span>
                      <button
                        onClick={() => handleDeleteConv(user)}
                        className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-[9px] font-bold hover:bg-red-500/30 transition-colors"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="px-2 py-0.5 bg-white/5 text-muted-foreground rounded text-[9px] hover:bg-white/10 transition-colors"
                      >
                        No
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : !showNewDm ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/50 gap-2">
            <Mail className="w-7 h-7 opacity-15" />
            <p className="text-[10px]">No conversations yet</p>
            <p className="text-[8px] font-mono">Tap "NEW" to start one</p>
          </div>
        ) : (
          <div className="p-3 space-y-3">
            <div className="flex flex-col gap-2 relative z-[100]" ref={dropdownRef}>
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={newRecipient}
                    onChange={(e) => {
                      setNewRecipient(e.target.value);
                      setShowUserDropdown(true);
                    }}
                    onFocus={() => setShowUserDropdown(true)}
                    placeholder="User..."
                    data-testid="input-sidebar-new-dm-recipient"
                    className="w-full bg-white/5 border border-white/10 rounded-md px-2.5 py-2 text-[10px] focus:outline-none focus:border-accent/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-white transition-colors"
                  >
                    <ChevronDown className={cn("w-3 h-3 transition-transform", showUserDropdown && "rotate-180")} />
                  </button>
                </div>
                <button
                  onClick={startNewConversation}
                  disabled={!newRecipient.trim()}
                  className="px-2.5 py-2 bg-accent text-accent-foreground rounded-md text-[9px] font-bold disabled:opacity-50 hover:bg-accent/90 transition-colors"
                  data-testid="button-sidebar-start-dm"
                >
                  GO
                </button>
              </div>

              <div className="mt-2 bg-card/40 border border-white/10 rounded-lg overflow-hidden max-h-[250px] overflow-y-auto shadow-xl backdrop-blur-md">
                {allUsers
                  ?.filter(u => u !== username && u.toLowerCase().includes(newRecipient.toLowerCase()))
                  .map(u => (
                    <button
                      key={u}
                      onClick={() => {
                        setNewRecipient(u);
                        setShowUserDropdown(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-[10px] transition-all border-b border-white/5 last:border-0 flex items-center gap-2",
                        newRecipient === u ? "bg-accent/20 text-accent" : "text-white hover:bg-white/5"
                      )}
                    >
                      <User className={cn("w-3 h-3", newRecipient === u ? "text-accent" : "text-muted-foreground")} />
                      <span className="font-medium truncate">{u}</span>
                    </button>
                  ))
                }
                {(!allUsers || allUsers.filter(u => u !== username && u.toLowerCase().includes(newRecipient.toLowerCase())).length === 0) && (
                  <div className="px-3 py-6 text-center text-muted-foreground/40 italic text-[9px]">
                    No users found
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function SidebarOnlineView({
  username,
  onDmUser,
}: {
  username: string;
  onDmUser: (user: string) => void;
}) {
  const onlineUsers = useOnlineUsers(username);

  return (
    <>
      <div className="px-3 py-2 border-b border-white/10 flex items-center gap-2 bg-green-500/5">
        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        <span className="text-[9px] font-display font-bold text-green-400 uppercase tracking-wider">
          {onlineUsers.length} Online
        </span>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 p-1.5">
        {onlineUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/40 gap-2">
            <Wifi className="w-7 h-7 opacity-15" />
            <p className="text-[10px]">No one online</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {onlineUsers.map((user) => {
              const isMe = user === username;
              return (
                <motion.div
                  key={user}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors group"
                >
                  <div className="relative">
                    <div className="w-6 h-6 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                      <User className="w-3 h-3 text-green-400" />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400 border border-background" />
                  </div>

                  <span className={cn(
                    "flex-1 text-xs font-medium truncate",
                    isMe ? "text-green-400" : "text-white"
                  )}>
                    {user}
                    {isMe && <span className="text-[9px] text-green-400/60 ml-1 font-mono">(you)</span>}
                  </span>

                  {!isMe && (
                    <button
                      onClick={() => onDmUser(user)}
                      data-testid={`button-sidebar-online-dm-${user}`}
                      title={`DM ${user}`}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 transition-all"
                    >
                      <Mail className="w-3 h-3" />
                    </button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </>
  );
}

export function SidebarChat() {
  const [isVisible, setIsVisible] = useState(true);
  const [username, setUsername] = useState(() => localStorage.getItem("chatUsername") || "");
  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState<SidebarTab>("global");
  const [pendingDmUser, setPendingDmUser] = useState<string | null>(null);
  const [totalUnread, setTotalUnread] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useMessages();
  const { mutate: sendMessage, isPending } = useCreateMessage();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isVisible, username]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !username.trim()) return;
    sendMessage(
      { username, content: input },
      { onSuccess: () => setInput("") }
    );
  };

  const handleDmUser = (user: string) => {
    setPendingDmUser(user);
    setActiveTab("dm");
  };

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
        <AnimatePresence>
          {isVisible && !username && (
            <ChatUsernameOverlay onComplete={(name) => setUsername(name)} />
          )}
        </AnimatePresence>

        {/* Tab bar */}
        <div className="p-3 border-b border-white/10 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex bg-background/50 border border-white/10 rounded-lg p-0.5 gap-0.5">
              <button
                onClick={() => setActiveTab("global")}
                data-testid="button-sidebar-tab-global"
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all duration-200",
                  activeTab === "global"
                    ? "bg-secondary/15 text-secondary border border-secondary/30"
                    : "text-muted-foreground hover:text-white border border-transparent"
                )}
              >
                <Globe className="w-3 h-3" />
                <span>Global</span>
              </button>
              <button
                onClick={() => setActiveTab("dm")}
                data-testid="button-sidebar-tab-dm"
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all duration-200 relative",
                  activeTab === "dm"
                    ? "bg-accent/15 text-accent border border-accent/30"
                    : "text-muted-foreground hover:text-white border border-transparent"
                )}
              >
                <Mail className="w-3 h-3" />
                <span>DMs</span>
                {totalUnread > 0 && (
                  <span
                    className="absolute -top-1 -right-1 min-w-[14px] h-3.5 rounded-full bg-accent text-accent-foreground text-[7px] font-bold flex items-center justify-center px-0.5 animate-pulse"
                    data-testid="badge-dm-tab-unread"
                  >
                    {totalUnread}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("online")}
                data-testid="button-sidebar-tab-online"
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all duration-200",
                  activeTab === "online"
                    ? "bg-green-500/15 text-green-400 border border-green-500/30"
                    : "text-muted-foreground hover:text-white border border-transparent"
                )}
              >
                <Wifi className="w-3 h-3" />
                <span>Online</span>
              </button>
            </div>
            <div className="flex items-center gap-1.5 bg-background/50 border border-white/10 rounded-full px-2.5 py-1 opacity-70">
              <User className="w-2.5 h-2.5 text-muted-foreground" />
              <span className="text-[10px] font-mono text-secondary">{username || "Anon"}</span>
            </div>
          </div>
        </div>

        {activeTab === "global" && (
          <>
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-3 space-y-3 scroll-smooth min-h-0"
            >
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-secondary" />
                  <p className="font-mono text-[10px] animate-pulse">CONNECTING...</p>
                </div>
              ) : messages?.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 gap-2">
                  <p className="text-xs">No messages yet.</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {messages?.map((msg) => {
                    const isMe = msg.username === username;
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col gap-1"
                      >
                        <div className="flex items-baseline gap-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${isMe ? "text-secondary" : "text-accent"}`}>
                            {msg.username}
                          </span>
                          <span className="text-[9px] text-muted-foreground font-mono">
                            {format(new Date(msg.createdAt || new Date()), "HH:mm")}
                          </span>
                        </div>
                        <div className={`px-3 py-2 rounded-xl text-xs leading-relaxed border ${
                          isMe
                            ? "bg-secondary/10 text-secondary-foreground border-secondary/20 rounded-tr-none"
                            : "bg-white/5 text-foreground border-white/10 rounded-tl-none"
                        }`}>
                          {msg.content}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            <div className="p-2 bg-background/50 border-t border-white/10">
              <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={!username ? "Set username first..." : "Message everyone..."}
                  disabled={!username}
                  data-testid="input-sidebar-chat-message"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 pr-10 text-xs focus:outline-none focus:border-secondary/50 transition-all font-medium disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isPending || !input.trim() || !username.trim()}
                  data-testid="button-sidebar-send-message"
                  className="absolute right-1.5 p-1.5 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 disabled:opacity-50 transition-all"
                >
                  {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </button>
              </form>
            </div>
          </>
        )}

        {activeTab === "dm" && (
          username
            ? <SidebarDMView username={username} initialChat={pendingDmUser} onUnreadCountChange={setTotalUnread} />
            : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/50 gap-2 p-4">
                <Mail className="w-8 h-8 opacity-20" />
                <p className="text-[10px] text-center">Set a username first to use DMs</p>
              </div>
            )
        )}

        {activeTab === "online" && (
          <SidebarOnlineView username={username} onDmUser={handleDmUser} />
        )}
      </motion.div>
    </div>
  );
}
