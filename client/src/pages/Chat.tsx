import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/Layout";
import { useMessages, useCreateMessage } from "@/hooks/use-messages";
import { useDirectMessages, useCreateDirectMessage, useConversations, useDeleteConversation, useUnreadCounts } from "@/hooks/use-dm";
import { useGroups, useGroupMessages, useCreateGroup, useSendGroupMessage, useLeaveGroup, type GroupWithMembers } from "@/hooks/use-groups";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useOnlineUsers } from "@/hooks/use-online-users";
import {
  Send, Loader2, MessageSquare, Mail, Plus, X,
  Wifi, Ban, Trash2, Hash,
  Shield, UsersRound, LogOut, Check
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type ActiveView =
  | { kind: "global" }
  | { kind: "dm"; user: string }
  | { kind: "group"; id: number };

function viewKey(v: ActiveView) {
  if (v.kind === "global") return "global";
  if (v.kind === "dm") return `dm:${v.user}`;
  return `group:${v.id}`;
}

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

function GroupAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const sizeClass = size === "md" ? "w-8 h-8 text-xs" : "w-7 h-7 text-[10px]";
  return (
    <div className={cn(
      "rounded-lg bg-gradient-to-br from-secondary/40 to-accent/40 border border-white/10 flex items-center justify-center font-bold text-white",
      sizeClass
    )}>
      <UsersRound className="w-3.5 h-3.5" />
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
  msg: { id: number; username: string; content: string; createdAt: string | Date | null };
  isMe: boolean;
  isOnline: boolean;
  prevMsg?: { username: string; createdAt: string | Date | null } | null;
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

function CreateGroupModal({ open, onClose, allUsers, currentUser, onlineUsers }: {
  open: boolean;
  onClose: () => void;
  allUsers: string[];
  currentUser: string;
  onlineUsers: string[];
}) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const { mutate: createGroup, isPending } = useCreateGroup();

  useEffect(() => {
    if (!open) {
      setName("");
      setSelected(new Set());
      setSearch("");
    }
  }, [open]);

  if (!open) return null;

  const candidates = allUsers
    .filter(u => u !== currentUser && u.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 100);

  const toggle = (u: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(u)) next.delete(u); else next.add(u);
      return next;
    });
  };

  const handleCreate = () => {
    if (!name.trim() || selected.size === 0) return;
    createGroup(
      { name: name.trim(), createdBy: currentUser, members: Array.from(selected) },
      { onSuccess: () => onClose() }
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
      data-testid="modal-create-group"
    >
      <div
        className="bg-[#0d0d18] border border-white/15 rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-secondary/20 border border-secondary/30 flex items-center justify-center">
            <UsersRound className="w-4 h-4 text-secondary" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">New Group Chat</h2>
            <p className="text-[10px] text-muted-foreground/60 font-mono">Pick members and a name</p>
          </div>
          <button
            onClick={onClose}
            data-testid="button-close-create-group"
            className="p-1.5 rounded hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 border-b border-white/10 space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Group name..."
            data-testid="input-group-name"
            maxLength={40}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-secondary/50 placeholder:text-muted-foreground/40"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users to add..."
            data-testid="input-group-search-users"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent/50 placeholder:text-muted-foreground/40"
          />
          {selected.size > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {Array.from(selected).map(u => (
                <span
                  key={u}
                  data-testid={`chip-selected-${u}`}
                  className="flex items-center gap-1 px-2 py-1 rounded-full bg-secondary/15 border border-secondary/30 text-[10px] text-secondary"
                >
                  {u}
                  <button
                    onClick={() => toggle(u)}
                    className="hover:text-white"
                    data-testid={`button-remove-selected-${u}`}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 p-2">
          {candidates.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground/50 font-mono">No users found</div>
          ) : (
            candidates.map(u => {
              const isSelected = selected.has(u);
              return (
                <button
                  key={u}
                  onClick={() => toggle(u)}
                  data-testid={`button-toggle-user-${u}`}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors",
                    isSelected ? "bg-secondary/10 hover:bg-secondary/15" : "hover:bg-white/5"
                  )}
                >
                  <Avatar name={u} size="sm" online={onlineUsers.includes(u)} />
                  <span className="flex-1 text-xs font-medium text-white truncate">{u}</span>
                  <div className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                    isSelected ? "bg-secondary border-secondary" : "border-white/25"
                  )}>
                    {isSelected && <Check className="w-3 h-3 text-black" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="px-5 py-3 border-t border-white/10 bg-black/30 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground/60 font-mono">
            {selected.size} {selected.size === 1 ? "member" : "members"} selected
          </span>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || selected.size === 0 || isPending}
            data-testid="button-create-group"
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-secondary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Chat() {
  const queryClient = useQueryClient();
  const username = localStorage.getItem("chatUsername") || "";
  const dmParam = new URLSearchParams(window.location.search).get("dm") || null;
  const groupParam = new URLSearchParams(window.location.search).get("group");

  const initialView: ActiveView = groupParam
    ? { kind: "group", id: parseInt(groupParam, 10) }
    : dmParam
    ? { kind: "dm", user: dmParam }
    : { kind: "global" };

  const [activeView, setActiveView] = useState<ActiveView>(initialView);
  const [input, setInput] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [showNewDm, setShowNewDm] = useState(false);
  const [newDmSearch, setNewDmSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [leaveConfirm, setLeaveConfirm] = useState<number | null>(null);

  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onlineUsers = useOnlineUsers(username);
  const { data: messages, isLoading: globalLoading } = useMessages();
  const { mutate: sendMessage, isPending: sendingGlobal } = useCreateMessage();
  const { data: conversations } = useConversations(username);
  const { data: dmMessages, isLoading: dmLoading } = useDirectMessages(
    username,
    activeView.kind === "dm" ? activeView.user : ""
  );
  const { mutate: sendDm, isPending: sendingDm } = useCreateDirectMessage();
  const { mutate: deleteConversation } = useDeleteConversation();
  const { data: unreadCounts } = useUnreadCounts(username);
  const { data: allUsers } = useQuery<string[]>({ queryKey: ["/api/users"] });

  const { data: groups } = useGroups(username);
  const activeGroupId = activeView.kind === "group" ? activeView.id : null;
  const { data: groupMsgs, isLoading: groupLoading } = useGroupMessages(activeGroupId, username);
  const { mutate: sendGroupMsg, isPending: sendingGroup } = useSendGroupMessage();
  const { mutate: leaveGroup } = useLeaveGroup();

  const activeGroup: GroupWithMembers | undefined =
    activeView.kind === "group" ? groups?.find(g => g.id === activeView.id) : undefined;

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
    if (messagesScrollRef.current) {
      messagesScrollRef.current.scrollTop = messagesScrollRef.current.scrollHeight;
    }
  }, [messages, dmMessages, groupMsgs, activeView]);

  useEffect(() => {
    if (activeView.kind === "dm" && username) {
      queryClient.invalidateQueries({ queryKey: ["/api/dm/unread", username] });
    }
  }, [activeView, username, queryClient]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [activeView]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (activeView.kind === "global") {
      if (isMuted) return;
      sendMessage({ username, content: input }, { onSuccess: () => setInput("") });
    } else if (activeView.kind === "dm") {
      sendDm(
        { fromUser: username, toUser: activeView.user, content: input },
        { onSuccess: () => setInput("") }
      );
    } else {
      sendGroupMsg(
        { groupId: activeView.id, fromUser: username, content: input },
        { onSuccess: () => setInput("") }
      );
    }
  };

  const startDm = (user: string) => {
    setActiveView({ kind: "dm", user });
    setShowNewDm(false);
    setNewDmSearch("");
  };

  const handleDelete = (user: string) => {
    deleteConversation({ username, otherUser: user });
    setDeleteConfirm(null);
    if (activeView.kind === "dm" && activeView.user === user) {
      setActiveView({ kind: "global" });
    }
  };

  const handleLeaveGroup = (groupId: number) => {
    leaveGroup({ groupId, username });
    setLeaveConfirm(null);
    if (activeView.kind === "group" && activeView.id === groupId) {
      setActiveView({ kind: "global" });
    }
  };

  const activeOnline = activeView.kind === "dm" ? onlineUsers.includes(activeView.user) : false;
  const filteredUsers = allUsers?.filter(u => u !== username && u.toLowerCase().includes(newDmSearch.toLowerCase())) ?? [];

  const sending = activeView.kind === "global" ? sendingGlobal : activeView.kind === "dm" ? sendingDm : sendingGroup;
  const placeholder = activeView.kind === "global"
    ? "Message #global..."
    : activeView.kind === "dm"
    ? `Message ${activeView.user}...`
    : `Message #${activeGroup?.name || "group"}...`;

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

          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Channels */}
            <div className="px-3 pt-4 pb-1">
              <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest px-1">Channels</span>
            </div>
            <button
              onClick={() => setActiveView({ kind: "global" })}
              data-testid="button-tab-global"
              className={cn(
                "mx-2 flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all w-[calc(100%-1rem)]",
                activeView.kind === "global"
                  ? "bg-white/10 text-white"
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              )}
            >
              <Hash className={cn("w-4 h-4 flex-shrink-0", activeView.kind === "global" ? "text-secondary" : "text-muted-foreground/60")} />
              <span>global</span>
            </button>

            {/* Groups */}
            <div className="px-3 pt-4 pb-1 flex items-center justify-between">
              <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest px-1">Groups</span>
              <button
                onClick={() => setShowCreateGroup(true)}
                data-testid="button-new-group"
                className="p-0.5 rounded text-muted-foreground/40 hover:text-white hover:bg-white/10 transition-all"
                title="New group"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            {groups && groups.length > 0 ? (
              groups.map(g => {
                const isActive = activeView.kind === "group" && activeView.id === g.id;
                return (
                  <div key={g.id} className="relative mx-2 group">
                    <button
                      onClick={() => setActiveView({ kind: "group", id: g.id })}
                      data-testid={`button-group-${g.id}`}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-left",
                        isActive ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white hover:bg-white/5"
                      )}
                    >
                      <GroupAvatar name={g.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{g.name}</p>
                        <p className="text-[9px] text-muted-foreground/50 font-mono truncate">
                          {g.members.length} {g.members.length === 1 ? "member" : "members"}
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setLeaveConfirm(leaveConfirm === g.id ? null : g.id); }}
                      data-testid={`button-leave-group-${g.id}`}
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/15 text-muted-foreground/30 hover:text-red-400 transition-all"
                      title="Leave group"
                    >
                      <LogOut className="w-3 h-3" />
                    </button>
                    {leaveConfirm === g.id && (
                      <div className="absolute left-0 right-0 top-full z-50 mt-1 mx-1 p-2 rounded-lg bg-[#0d0d18] border border-red-500/25 shadow-2xl flex items-center gap-2">
                        <span className="text-[10px] text-red-400 flex-1">Leave?</span>
                        <button onClick={() => handleLeaveGroup(g.id)} data-testid={`button-confirm-leave-${g.id}`} className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-[9px] font-bold hover:bg-red-500/30 transition-colors">Yes</button>
                        <button onClick={() => setLeaveConfirm(null)} className="px-2 py-0.5 bg-white/5 text-muted-foreground rounded text-[9px] hover:bg-white/10 transition-colors">No</button>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="px-4 py-1 text-[10px] text-muted-foreground/40 font-mono">No groups yet</p>
            )}

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

            <div className="pb-2">
              {conversations?.map((user) => {
                const unread = unreadCounts?.[user] ?? 0;
                const isActive = activeView.kind === "dm" && activeView.user === user;
                const isOnline = onlineUsers.includes(user);
                return (
                  <div key={user} className="relative mx-2 group">
                    <button
                      onClick={() => setActiveView({ kind: "dm", user })}
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

          {/* Channel/DM/Group header */}
          <div className="px-5 py-3 border-b border-white/10 bg-black/20 flex items-center gap-3 flex-shrink-0">
            {activeView.kind === "dm" ? (
              <>
                <Avatar name={activeView.user} size="md" online={activeOnline} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{activeView.user}</span>
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
            ) : activeView.kind === "group" && activeGroup ? (
              <>
                <GroupAvatar name={activeGroup.name} size="md" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{activeGroup.name}</span>
                    <span className="text-[9px] font-mono text-secondary">
                      ● {activeGroup.members.length} {activeGroup.members.length === 1 ? "member" : "members"}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground/50 font-mono truncate max-w-md">
                    {activeGroup.members.join(", ")}
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-[9px] font-mono text-secondary/60 uppercase tracking-wider border border-secondary/25 px-2 py-0.5 rounded-full">
                    GROUP
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
            ref={messagesScrollRef}
            className="flex-1 overflow-y-auto scroll-smooth py-2 relative"
          >
            {activeView.kind === "dm" ? (
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
            ) : activeView.kind === "group" ? (
              <>
                {groupLoading ? (
                  <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin text-secondary" />
                    <p className="text-xs font-mono animate-pulse">JOINING GROUP CHANNEL...</p>
                  </div>
                ) : !groupMsgs || groupMsgs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground/40">
                    <div className="w-16 h-16 rounded-full bg-secondary/5 border border-secondary/15 flex items-center justify-center">
                      <UsersRound className="w-7 h-7 opacity-30" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-muted-foreground/60">No messages yet</p>
                      <p className="text-[10px] font-mono mt-1">Say hi to your group</p>
                    </div>
                  </div>
                ) : (
                  <div className="py-2">
                    <AnimatePresence initial={false}>
                      {groupMsgs.map((msg, idx) => {
                        const isMe = msg.fromUser === username;
                        const isOnline = onlineUsers.includes(msg.fromUser);
                        const prevMsg = idx > 0 ? groupMsgs[idx - 1] : null;
                        const msgDate = new Date(msg.createdAt || new Date());
                        const prevDate = prevMsg ? new Date(prevMsg.createdAt || new Date()) : null;
                        const showDivider = !prevDate || formatDay(msgDate) !== formatDay(prevDate);
                        return (
                          <div key={msg.id}>
                            {showDivider && <DateDivider label={formatDay(msgDate)} />}
                            <GlobalMessage
                              msg={{ id: msg.id, username: msg.fromUser, content: msg.content, createdAt: msg.createdAt as unknown as string | null }}
                              isMe={isMe}
                              isOnline={isOnline}
                              prevMsg={prevMsg ? { username: prevMsg.fromUser, createdAt: prevMsg.createdAt as unknown as string | null } : null}
                            />
                          </div>
                        );
                      })}
                    </AnimatePresence>
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
              onSubmit={handleSend}
              className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-0.5 focus-within:border-white/25 focus-within:bg-white/8 transition-all"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={placeholder}
                data-testid="input-chat-message"
                disabled={activeView.kind === "global" && isMuted}
                className="flex-1 bg-transparent py-3.5 text-sm focus:outline-none placeholder:text-muted-foreground/40 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={sending || !input.trim() || (activeView.kind === "global" && isMuted)}
                data-testid="button-send-message"
                className="flex-shrink-0 p-2 bg-secondary/80 text-secondary-foreground rounded-lg hover:bg-secondary disabled:opacity-40 disabled:hover:bg-secondary/80 transition-all shadow-lg shadow-secondary/10"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
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

      <CreateGroupModal
        open={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        allUsers={allUsers ?? []}
        currentUser={username}
        onlineUsers={onlineUsers}
      />
    </Layout>
  );
}
