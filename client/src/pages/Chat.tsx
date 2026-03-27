import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/Layout";
import { useMessages, useCreateMessage } from "@/hooks/use-messages";
import { useDirectMessages, useCreateDirectMessage, useConversations } from "@/hooks/use-dm";
import { useQuery } from "@tanstack/react-query";
import { useOnlineUsers } from "@/hooks/use-online-users";
import { Send, User, Loader2, MessageSquare, Mail, ArrowLeft, Plus, X, Globe, Users, Wifi } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type Tab = "global" | "dm";

function OnlineBadge({ online }: { online: boolean }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider border",
      online
        ? "bg-green-500/15 text-green-400 border-green-500/30"
        : "bg-white/5 text-muted-foreground/50 border-white/10"
    )}>
      <span className={cn("w-1.5 h-1.5 rounded-full", online ? "bg-green-400 animate-pulse" : "bg-muted-foreground/40")} />
      {online ? "Online" : "Offline"}
    </span>
  );
}

function DMView({ username, onlineUsers, initialChat }: { username: string; onlineUsers: string[]; initialChat?: string }) {
  const [activeChat, setActiveChat] = useState<string | null>(initialChat || null);
  const [newRecipient, setNewRecipient] = useState("");
  const [showNewDm, setShowNewDm] = useState(false);
  const [dmInput, setDmInput] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dmScrollRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading: convsLoading } = useConversations(username);
  const { data: dmMessages, isLoading: dmsLoading } = useDirectMessages(username, activeChat || "");
  const { mutate: sendDm, isPending: dmPending } = useCreateDirectMessage();
  const { data: allUsers } = useQuery<string[]>({ queryKey: ["/api/users"] });

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

  if (activeChat) {
    const isOnline = onlineUsers.includes(activeChat);
    return (
      <>
        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3 bg-accent/5">
          <button onClick={() => setActiveChat(null)} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" data-testid="button-dm-back">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="w-7 h-7 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center relative">
            <User className="w-3.5 h-3.5 text-accent" />
            <span className={cn(
              "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card",
              isOnline ? "bg-green-400" : "bg-muted-foreground/40"
            )} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-display font-bold text-white uppercase tracking-tight">{activeChat}</span>
            <span className={cn("text-[9px] font-mono", isOnline ? "text-green-400" : "text-muted-foreground/50")}>
              {isOnline ? "● ONLINE" : "○ OFFLINE"}
            </span>
          </div>
          <span className="text-[10px] text-accent font-mono ml-auto">PRIVATE</span>
        </div>

        <div ref={dmScrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth">
          {dmsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-accent" />
            </div>
          ) : dmMessages && dmMessages.length > 0 ? (
            dmMessages.map((msg) => {
              const isMe = msg.fromUser === username;
              const readReceipt = msg.isRead
                ? `Read ${msg.readAt ? format(new Date(msg.readAt), "HH:mm") : ""}`
                : "Delivered";
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className={`text-xs font-bold uppercase tracking-wider ${isMe ? "text-secondary" : "text-accent"}`}>
                      {msg.fromUser}
                    </span>
                    <span className="text-[9px] text-muted-foreground font-mono">
                      {format(new Date(msg.createdAt || new Date()), "HH:mm")}
                    </span>
                  </div>
                  <div className={`max-w-[85%] md:max-w-[70%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-lg border ${
                    isMe
                      ? "bg-secondary/10 text-secondary-foreground border-secondary/20 rounded-tr-none"
                      : "bg-accent/10 text-foreground border-accent/20 rounded-tl-none"
                  }`}>
                    {msg.content}
                  </div>
                  <span className="text-[9px] text-muted-foreground/60 font-mono mt-1 px-1">
                    {readReceipt}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/50 gap-2">
              <Mail className="w-8 h-8 opacity-30" />
              <p className="text-xs">No messages yet. Say hi!</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-background/50 border-t border-white/10">
          <form onSubmit={handleSendDm} className="relative flex items-center gap-2">
            <input
              type="text"
              value={dmInput}
              onChange={(e) => setDmInput(e.target.value)}
              placeholder={`Message ${activeChat}...`}
              data-testid="input-dm-message"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 pr-12 text-sm focus:outline-none focus:border-accent/50 focus:bg-white/10 transition-all font-medium placeholder:text-muted-foreground/50"
            />
            <button
              type="submit"
              disabled={dmPending || !dmInput.trim()}
              data-testid="button-send-dm"
              className="absolute right-2 p-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-all shadow-lg shadow-accent/20"
            >
              {dmPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-accent/5">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-accent" />
          <span className="text-xs font-display font-bold text-accent uppercase tracking-wider">YOUR CONVERSATIONS</span>
        </div>
        <button
          onClick={() => { setShowNewDm(!showNewDm); setNewRecipient(""); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent text-xs font-bold hover:bg-accent/20 transition-colors"
          data-testid="button-new-dm"
        >
          {showNewDm ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          <span>{showNewDm ? "CANCEL" : "NEW DM"}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {showNewDm ? (
          <div className="p-4 space-y-4">
            <div className="flex flex-col gap-2" ref={dropdownRef}>
              <p className="text-[10px] text-muted-foreground mb-1 font-mono uppercase tracking-wider">Select a user to message:</p>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value)}
                    placeholder="Search users..."
                    data-testid="input-new-dm-recipient"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent/50 transition-all"
                    autoFocus
                  />
                </div>
                <button
                  onClick={startNewConversation}
                  disabled={!newRecipient.trim()}
                  className="px-4 py-2.5 bg-accent text-accent-foreground rounded-lg text-xs font-bold disabled:opacity-50 hover:bg-accent/90 transition-colors"
                  data-testid="button-start-dm"
                >
                  START
                </button>
              </div>

              <div className="mt-2 bg-card/30 border border-white/10 rounded-xl overflow-hidden max-h-[400px] overflow-y-auto shadow-2xl backdrop-blur-md">
                {allUsers
                  ?.filter(u => u !== username && u.toLowerCase().includes(newRecipient.toLowerCase()))
                  .map(u => {
                    const isOnline = onlineUsers.includes(u);
                    const isSelected = newRecipient === u;
                    return (
                      <button
                        key={u}
                        onClick={() => setNewRecipient(u)}
                        className={cn(
                          "w-full text-left px-4 py-3 text-sm transition-all border-b border-white/5 last:border-0 flex items-center gap-3",
                          isSelected ? "bg-accent/20 text-accent" : "text-white hover:bg-white/5"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-full border flex items-center justify-center relative transition-colors",
                          isSelected ? "bg-accent/20 border-accent/40" : "bg-white/5 border-white/10"
                        )}>
                          <User className={cn("w-4 h-4", isSelected ? "text-accent" : "text-muted-foreground")} />
                          <span className={cn(
                            "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card",
                            isOnline ? "bg-green-400" : "bg-muted-foreground/40"
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium block">{u}</span>
                        </div>
                        <OnlineBadge online={isOnline} />
                      </button>
                    );
                  })
                }
                {(!allUsers || allUsers.filter(u => u !== username && u.toLowerCase().includes(newRecipient.toLowerCase())).length === 0) && (
                  <div className="px-4 py-10 text-center text-muted-foreground/50 italic flex flex-col items-center gap-3">
                    <Users className="w-8 h-8 opacity-20" />
                    <p className="text-xs">No matching users found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : conversations && conversations.length > 0 ? (
          <div className="p-2">
            {conversations.map((user) => {
              const isOnline = onlineUsers.includes(user);
              return (
                <button
                  key={user}
                  onClick={() => setActiveChat(user)}
                  data-testid={`button-dm-conversation-${user}`}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-white/5 transition-colors text-left group"
                >
                  <div className="w-9 h-9 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center relative group-hover:border-accent/40 transition-colors">
                    <User className="w-4 h-4 text-accent" />
                    <span className={cn(
                      "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card",
                      isOnline ? "bg-green-400" : "bg-muted-foreground/40"
                    )} />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-white">{user}</span>
                    <p className="text-[10px] text-muted-foreground font-mono">Click to open</p>
                  </div>
                  <OnlineBadge online={isOnline} />
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/50 gap-3">
            <Mail className="w-10 h-10 opacity-20" />
            <p className="text-sm">No conversations yet</p>
            <p className="text-[10px] font-mono">Click "NEW DM" above to start one</p>
          </div>
        )}
      </div>
    </>
  );
}

function OnlineUsersSidebar({ onlineUsers, currentUsername }: { onlineUsers: string[]; currentUsername: string }) {
  return (
    <div className="w-48 flex-shrink-0 bg-card/60 backdrop-blur-sm border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
      <div className="px-4 py-3 border-b border-white/10 bg-green-500/5 flex items-center gap-2">
        <Wifi className="w-3.5 h-3.5 text-green-400" />
        <span className="text-[10px] font-display font-bold text-green-400 uppercase tracking-wider">Online</span>
        <span className="ml-auto text-[10px] font-mono text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded-full border border-green-500/20">
          {onlineUsers.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {onlineUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/40 gap-2">
            <Users className="w-6 h-6 opacity-20" />
            <p className="text-[9px] font-mono text-center">No one online yet</p>
          </div>
        ) : (
          onlineUsers.map((user) => (
            <div
              key={user}
              className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className="relative flex-shrink-0">
                <div className="w-6 h-6 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <User className="w-3 h-3 text-green-400" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400 border border-card animate-pulse" />
              </div>
              <span className={cn(
                "text-[10px] font-medium truncate",
                user === currentUsername ? "text-secondary" : "text-white"
              )}>
                {user === currentUsername ? `${user} (you)` : user}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function Chat() {
  const username = localStorage.getItem("chatUsername") || "";
  const [input, setInput] = useState("");
  const dmParam = new URLSearchParams(window.location.search).get("dm") || undefined;
  const [activeTab, setActiveTab] = useState<Tab>(dmParam ? "dm" : "global");
  const scrollRef = useRef<HTMLDivElement>(null);

  const onlineUsers = useOnlineUsers(username);
  const { data: messages, isLoading } = useMessages();
  const { mutate: sendMessage, isPending } = useCreateMessage();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(
      { username, content: input },
      { onSuccess: () => setInput("") }
    );
  };

  return (
    <Layout>
      <div className="h-[calc(100vh-12rem)] md:h-[calc(100vh-10rem)] max-w-6xl mx-auto flex flex-col gap-4 relative">

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="flex bg-card/80 border border-white/10 rounded-xl p-1 gap-1">
              <button
                onClick={() => setActiveTab("global")}
                data-testid="button-tab-global"
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300",
                  activeTab === "global"
                    ? "bg-secondary/15 text-secondary border border-secondary/30 shadow-lg shadow-secondary/10"
                    : "text-muted-foreground hover:text-white hover:bg-white/5 border border-transparent"
                )}
              >
                <Globe className="w-4 h-4" />
                <span>Global Chat</span>
              </button>
              <button
                onClick={() => setActiveTab("dm")}
                data-testid="button-tab-dm"
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300",
                  activeTab === "dm"
                    ? "bg-accent/15 text-accent border border-accent/30 shadow-lg shadow-accent/10"
                    : "text-muted-foreground hover:text-white hover:bg-white/5 border border-transparent"
                )}
              >
                <Mail className="w-4 h-4" />
                <span>Direct Messages</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-lg max-w-md hidden lg:block">
              <p className="text-[10px] text-red-400 leading-tight font-mono uppercase tracking-wider">
                WARNING: I.T can see this if they find the website so maybe dont say anything bad
              </p>
            </div>
            <div className="flex items-center gap-2 bg-card border border-white/10 rounded-full px-4 py-1.5 opacity-70">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-mono text-secondary" data-testid="text-chat-username">{username || "Anonymous"}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex gap-4 min-h-0">
          <div className="flex-1 bg-card/60 backdrop-blur-sm border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl relative min-h-0">
            {activeTab === "global" ? (
              <>
                <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2 bg-secondary/5">
                  <Globe className="w-4 h-4 text-secondary" />
                  <span className="text-xs font-display font-bold text-secondary uppercase tracking-wider">EVERYONE CAN SEE THESE MESSAGES</span>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth">
                  {isLoading ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-secondary" />
                      <p className="font-mono text-sm animate-pulse">ESTABLISHING UPLINK...</p>
                    </div>
                  ) : messages?.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50 gap-2">
                      <MessageSquare className="w-12 h-12 opacity-20" />
                      <p>No messages yet. Be the first to speak.</p>
                    </div>
                  ) : (
                    <AnimatePresence initial={false}>
                      {messages?.map((msg) => {
                        const isMe = msg.username === username;
                        const isOnline = onlineUsers.includes(msg.username);
                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, x: isMe ? 20 : -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                          >
                            <div className="flex items-baseline gap-2 mb-1">
                              <span className={`text-xs font-bold uppercase tracking-wider ${isMe ? "text-secondary" : "text-accent"}`}>
                                {msg.username}
                              </span>
                              {!isMe && (
                                <span className={cn("w-1.5 h-1.5 rounded-full inline-block", isOnline ? "bg-green-400" : "bg-muted-foreground/30")} />
                              )}
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {format(new Date(msg.createdAt || new Date()), "HH:mm")}
                              </span>
                            </div>
                            <div className={`max-w-[85%] md:max-w-[70%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-lg ${
                              isMe
                                ? "bg-secondary/10 text-secondary-foreground border border-secondary/20 rounded-tr-none"
                                : "bg-white/5 text-foreground border border-white/10 rounded-tl-none"
                            }`}>
                              {msg.content}
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  )}
                </div>

                <div className="p-4 bg-background/50 border-t border-white/10">
                  <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Message everyone..."
                      data-testid="input-chat-message"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 pr-12 text-sm focus:outline-none focus:border-secondary/50 focus:bg-white/10 transition-all font-medium placeholder:text-muted-foreground/50 disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={isPending || !input.trim()}
                      data-testid="button-send-message"
                      className="absolute right-2 p-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 disabled:opacity-50 disabled:hover:bg-secondary transition-all shadow-lg shadow-secondary/20"
                    >
                      {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <DMView username={username} onlineUsers={onlineUsers} initialChat={dmParam} />
            )}
          </div>

          <OnlineUsersSidebar onlineUsers={onlineUsers} currentUsername={username} />
        </div>
      </div>
    </Layout>
  );
}
