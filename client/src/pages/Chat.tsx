import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/Layout";
import { useGroups, useGroupMessages, useCreateGroup, useSendGroupMessage, useLeaveGroup, useAddGroupMembers, type GroupWithMembers } from "@/hooks/use-groups";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Send, Loader2, Plus, X,
  Shield, UsersRound, LogOut, Check, RefreshCw, UserPlus, Zap, MessageSquare
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

function formatDay(date: Date) {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM d, yyyy");
}

function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" | "lg" }) {
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
  return (
    <div className={cn("rounded-full bg-gradient-to-br flex items-center justify-center font-bold text-white flex-shrink-0", sizeClass, colors[colorIdx])}>
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function DateDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-4 px-4">
      <div className="flex-1 h-px bg-white/8" />
      <span className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-[0.2em]">{label}</span>
      <div className="flex-1 h-px bg-white/8" />
    </div>
  );
}

function GroupMessage({ msg, isMe, prevMsg }: {
  msg: { id: number; fromUser: string; content: string; createdAt: string | Date | null };
  isMe: boolean;
  prevMsg?: { fromUser: string; createdAt: string | Date | null } | null;
}) {
  const msgDate = new Date(msg.createdAt || new Date());
  const prevDate = prevMsg ? new Date(prevMsg.createdAt || new Date()) : null;
  const isGrouped = prevMsg?.fromUser === msg.fromUser &&
    prevDate && (msgDate.getTime() - prevDate.getTime()) < 5 * 60 * 1000;

  return (
    <motion.div
      key={msg.id}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={cn("flex gap-3 px-4 py-0.5 group hover:bg-white/[0.015] rounded transition-colors", isGrouped ? "mt-0.5" : "mt-3")}
    >
      {!isGrouped ? (
        <Avatar name={msg.fromUser} size="md" />
      ) : (
        <div className="w-8 flex-shrink-0 flex items-center justify-center">
          <span className="text-[9px] text-muted-foreground/25 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
            {format(msgDate, "HH:mm")}
          </span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        {!isGrouped && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className={cn("text-sm font-bold font-display tracking-wide", isMe ? "text-secondary" : "text-white/90")}>
              {msg.fromUser}
            </span>
            <span className="text-[9px] text-muted-foreground/40 font-mono">
              {format(msgDate, "HH:mm")}
            </span>
          </div>
        )}
        <p className="text-sm text-foreground/80 leading-relaxed break-words">{msg.content}</p>
      </div>
    </motion.div>
  );
}

function UserPickerModal({ open, onClose, title, subtitle, existingMembers = [], allUsers, currentUser, onRefresh, isRefreshing, confirmLabel, onConfirm, isPending, confirmColor = "secondary" }: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  existingMembers?: string[];
  allUsers: string[];
  currentUser: string;
  onRefresh: () => void;
  isRefreshing: boolean;
  confirmLabel: string;
  onConfirm: (selected: string[]) => void;
  isPending: boolean;
  confirmColor?: "secondary" | "accent";
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [groupName, setGroupName] = useState("");
  const needsName = title === "New Group";

  useEffect(() => {
    if (!open) { setSelected(new Set()); setSearch(""); setGroupName(""); }
  }, [open]);

  if (!open) return null;

  const excluded = new Set([...existingMembers, currentUser]);
  const candidates = allUsers
    .filter(u => !excluded.has(u) && u.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 100);

  const toggle = (u: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(u)) next.delete(u); else next.add(u);
      return next;
    });
  };

  const accentClass = confirmColor === "accent"
    ? "bg-accent/10 border-accent/30 text-accent hover:bg-accent/20"
    : "bg-secondary/10 border-secondary/30 text-secondary hover:bg-secondary/20";

  const confirmBtnClass = confirmColor === "accent"
    ? "bg-accent text-white hover:bg-accent/90"
    : "bg-secondary text-secondary-foreground hover:bg-secondary/90";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
      data-testid="modal-user-picker"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="bg-card/95 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden"
        style={{ boxShadow: confirmColor === "accent" ? "0 0 40px rgba(255,0,193,0.12)" : "0 0 40px rgba(0,255,255,0.10)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
          <div className={cn("w-8 h-8 rounded-lg border flex items-center justify-center", accentClass)}>
            {confirmColor === "accent" ? <UserPlus className="w-4 h-4" /> : <UsersRound className="w-4 h-4" />}
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-display font-bold text-white uppercase tracking-wider">{title}</h2>
            <p className="text-[10px] text-muted-foreground/60 font-mono">{subtitle}</p>
          </div>
          <button onClick={onClose} data-testid="button-close-modal" className="p-1.5 rounded hover:bg-white/10 text-muted-foreground hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-white/10 space-y-3">
          {needsName && (
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name..."
              data-testid="input-group-name"
              maxLength={40}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-secondary/50 placeholder:text-muted-foreground/40 font-mono"
            />
          )}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              data-testid="input-user-search"
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-secondary/50 placeholder:text-muted-foreground/40 font-mono"
            />
            <button type="button" onClick={onRefresh} disabled={isRefreshing} data-testid="button-refresh-users" title="Refresh" className="p-2 rounded-lg bg-white/5 border border-white/10 text-muted-foreground hover:text-white hover:bg-white/10 disabled:opacity-40 transition-all">
              <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
            </button>
          </div>
          {selected.size > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {Array.from(selected).map(u => (
                <span key={u} data-testid={`chip-selected-${u}`} className={cn("flex items-center gap-1 px-2 py-1 rounded-full border text-[10px]", accentClass)}>
                  {u}
                  <button onClick={() => toggle(u)} data-testid={`button-remove-chip-${u}`} className="hover:text-white"><X className="w-2.5 h-2.5" /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 p-2">
          {candidates.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground/40 font-mono">No users found</div>
          ) : (
            candidates.map(u => {
              const isSel = selected.has(u);
              return (
                <button key={u} onClick={() => toggle(u)} data-testid={`button-toggle-user-${u}`}
                  className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors", isSel ? (confirmColor === "accent" ? "bg-accent/10" : "bg-secondary/10") : "hover:bg-white/5")}>
                  <Avatar name={u} size="sm" />
                  <span className="flex-1 text-xs font-medium text-white truncate">{u}</span>
                  <div className={cn("w-4 h-4 rounded border flex items-center justify-center transition-colors", isSel ? (confirmColor === "accent" ? "bg-accent border-accent" : "bg-secondary border-secondary") : "border-white/20")}>
                    {isSel && <Check className="w-3 h-3 text-black" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="px-5 py-3 border-t border-white/10 bg-black/20 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground/50 font-mono">{selected.size} selected</span>
          <button
            onClick={() => onConfirm(needsName ? [groupName, ...Array.from(selected)] : Array.from(selected))}
            disabled={(needsName ? !groupName.trim() : false) || selected.size === 0 || isPending}
            data-testid="button-confirm-pick"
            className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed transition-all", confirmBtnClass)}
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : confirmColor === "accent" ? <UserPlus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function Chat() {
  const queryClient = useQueryClient();
  const username = localStorage.getItem("chatUsername") || "";
  const groupParam = new URLSearchParams(window.location.search).get("group");

  const [activeGroupId, setActiveGroupId] = useState<number | null>(groupParam ? parseInt(groupParam, 10) : null);
  const [input, setInput] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [leaveConfirm, setLeaveConfirm] = useState<number | null>(null);

  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: groups } = useGroups(username);
  const { data: groupMsgs, isLoading: groupLoading } = useGroupMessages(activeGroupId, username);
  const { mutate: sendGroupMsg, isPending: sendingGroup } = useSendGroupMessage();
  const { mutate: leaveGroup } = useLeaveGroup();
  const { mutate: createGroup, isPending: creatingGroup } = useCreateGroup();
  const { mutate: addMembers, isPending: addingMembers } = useAddGroupMembers();
  const { data: allUsers, refetch: refetchUsers, isFetching: isFetchingUsers } = useQuery<string[]>({
    queryKey: ["/api/users"],
    refetchInterval: 60000,
    refetchOnWindowFocus: false,
    staleTime: 30000,
  });

  const activeGroup: GroupWithMembers | undefined = groups?.find(g => g.id === activeGroupId);

  useEffect(() => {
    if (messagesScrollRef.current) {
      messagesScrollRef.current.scrollTop = messagesScrollRef.current.scrollHeight;
    }
  }, [groupMsgs, activeGroupId]);

  useEffect(() => { inputRef.current?.focus(); }, [activeGroupId]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeGroupId) return;
    sendGroupMsg({ groupId: activeGroupId, fromUser: username, content: input }, { onSuccess: () => setInput("") });
  };

  const handleLeaveGroup = (groupId: number) => {
    leaveGroup({ groupId, username });
    setLeaveConfirm(null);
    if (activeGroupId === groupId) setActiveGroupId(null);
  };

  const handleCreateGroup = (args: string[]) => {
    const [name, ...members] = args;
    createGroup({ name, createdBy: username, members }, { onSuccess: () => setShowCreateGroup(false) });
  };

  const handleAddMembers = (usernames: string[]) => {
    if (!activeGroupId) return;
    addMembers({ groupId: activeGroupId, usernames, addedBy: username }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/groups/user", username] });
        setShowAddMember(false);
      }
    });
  };

  return (
    <Layout noContainer>
      <div className="flex h-full bg-background">

        {/* ── LEFT SIDEBAR ── */}
        <div className="w-56 flex-shrink-0 flex flex-col border-r border-white/8 overflow-hidden" style={{ background: "hsl(240 25% 8%)" }}>

          {/* Header */}
          <div className="px-4 py-3.5 border-b border-white/8 flex items-center gap-2.5 shrink-0" style={{ background: "hsl(240 25% 7%)" }}>
            <Shield className="w-4 h-4 text-secondary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-display font-black text-white uppercase tracking-widest leading-none">RELC.OS</p>
              <p className="text-[8px] font-mono text-secondary/50 uppercase tracking-[0.2em] mt-0.5">COMMS TERMINAL</p>
            </div>
          </div>

          {/* Groups list */}
          <div className="flex-1 overflow-y-auto min-h-0 py-2">
            <div className="px-3 pt-2 pb-1 flex items-center justify-between">
              <span className="text-[8px] font-display font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">Groups</span>
              <button
                onClick={() => setShowCreateGroup(true)}
                data-testid="button-new-group"
                className="p-0.5 rounded text-muted-foreground/30 hover:text-secondary hover:bg-secondary/10 transition-all"
                title="New group"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {groups && groups.length > 0 ? groups.map(g => {
              const isActive = activeGroupId === g.id;
              return (
                <div key={g.id} className="relative mx-2 group/item mb-0.5">
                  <button
                    onClick={() => setActiveGroupId(g.id)}
                    data-testid={`button-group-${g.id}`}
                    className={cn(
                      "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg transition-all text-left",
                      isActive
                        ? "bg-secondary/10 text-white border border-secondary/25"
                        : "text-muted-foreground hover:text-white hover:bg-white/5"
                    )}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors",
                      isActive ? "bg-secondary/20 border border-secondary/30" : "bg-white/5 border border-white/10"
                    )}>
                      <UsersRound className={cn("w-3 h-3", isActive ? "text-secondary" : "text-muted-foreground")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{g.name}</p>
                      <p className="text-[9px] text-muted-foreground/40 font-mono">{g.members.length}m</p>
                    </div>
                    {isActive && <div className="w-1 h-1 rounded-full bg-secondary shrink-0 animate-pulse" />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setLeaveConfirm(leaveConfirm === g.id ? null : g.id); }}
                    data-testid={`button-leave-group-${g.id}`}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 p-1 rounded hover:bg-red-500/15 text-muted-foreground/20 hover:text-red-400 transition-all"
                    title="Leave group"
                  >
                    <LogOut className="w-2.5 h-2.5" />
                  </button>
                  {leaveConfirm === g.id && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-1 mx-1 p-2 rounded-lg bg-card/95 border border-red-500/20 shadow-2xl flex items-center gap-2 backdrop-blur-sm">
                      <span className="text-[10px] text-red-400/80 flex-1 font-mono">Leave?</span>
                      <button onClick={() => handleLeaveGroup(g.id)} data-testid={`button-confirm-leave-${g.id}`} className="px-2 py-0.5 bg-red-500/15 text-red-400 rounded text-[9px] font-bold hover:bg-red-500/25 transition-colors">Yes</button>
                      <button onClick={() => setLeaveConfirm(null)} className="px-2 py-0.5 bg-white/5 text-muted-foreground rounded text-[9px] hover:bg-white/10 transition-colors">No</button>
                    </div>
                  )}
                </div>
              );
            }) : (
              <div className="px-4 py-6 flex flex-col items-center gap-2 text-center">
                <UsersRound className="w-5 h-5 text-muted-foreground/20" />
                <p className="text-[9px] font-mono text-muted-foreground/30 uppercase tracking-wider">No groups yet</p>
                <button
                  onClick={() => setShowCreateGroup(true)}
                  className="text-[9px] font-bold font-mono text-secondary/60 hover:text-secondary uppercase tracking-wider transition-colors"
                >
                  + Create one
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-3 border-t border-white/8 flex items-center gap-2 shrink-0" style={{ background: "hsl(240 25% 7%)" }}>
            <Avatar name={username || "?"} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{username || "Anonymous"}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span className="text-[8px] font-mono text-green-400/60 uppercase tracking-wider">Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── MAIN MESSAGES AREA ── */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Group header */}
          <div className="px-5 py-3 border-b border-white/8 flex items-center gap-3 flex-shrink-0 relative overflow-hidden" style={{ background: "hsl(240 25% 9%)" }}>
            {/* scanline effect */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
              style={{ backgroundImage: "repeating-linear-gradient(0deg, #fff 0, #fff 1px, transparent 1px, transparent 3px)" }} />

            {activeGroup ? (
              <>
                <div className="w-9 h-9 rounded-xl bg-secondary/10 border border-secondary/25 flex items-center justify-center shrink-0">
                  <UsersRound className="w-4.5 h-4.5 text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 uppercase tracking-wider leading-none truncate">
                    {activeGroup.name}
                  </h2>
                  <p className="text-[9px] font-mono text-muted-foreground/50 mt-0.5 truncate">
                    <span className="text-secondary/60">●</span> {activeGroup.members.length} {activeGroup.members.length === 1 ? "member" : "members"} — {activeGroup.members.join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShowAddMember(true)}
                    data-testid="button-add-member"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-accent/8 border border-accent/20 text-accent text-[9px] font-bold font-mono uppercase tracking-wider hover:bg-accent/15 hover:border-accent/35 transition-all"
                  >
                    <UserPlus className="w-3 h-3" />
                    Add
                  </button>
                  <div className="px-2 py-1 rounded-full border border-secondary/20 bg-secondary/5">
                    <span className="text-[8px] font-mono text-secondary/50 uppercase tracking-[0.2em]">GROUP</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 text-muted-foreground/30" />
                </div>
                <div>
                  <h2 className="text-sm font-display font-bold text-muted-foreground/50 uppercase tracking-wider">Select a group</h2>
                  <p className="text-[9px] font-mono text-muted-foreground/30 mt-0.5">Choose from the sidebar or create one</p>
                </div>
              </>
            )}
          </div>

          {/* Messages */}
          <div ref={messagesScrollRef} className="flex-1 overflow-y-auto scroll-smooth py-2 relative" style={{ background: "hsl(240 22% 11%)" }}>
            {!activeGroupId ? (
              <div className="h-full flex flex-col items-center justify-center gap-5 text-muted-foreground/30 px-8">
                <div className="w-20 h-20 rounded-2xl bg-secondary/5 border border-secondary/10 flex items-center justify-center">
                  <UsersRound className="w-9 h-9 text-secondary/20" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-display font-bold text-muted-foreground/50 uppercase tracking-wider mb-1">No Group Selected</p>
                  <p className="text-[10px] font-mono text-muted-foreground/30 uppercase tracking-wider">Pick a group or create a new one</p>
                </div>
                <button
                  onClick={() => setShowCreateGroup(true)}
                  data-testid="button-create-group-empty"
                  className="flex items-center gap-2 px-5 py-2.5 bg-secondary/8 border border-secondary/20 text-secondary rounded-xl text-[10px] font-bold font-mono uppercase tracking-widest hover:bg-secondary/15 hover:border-secondary/35 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Group
                </button>
              </div>
            ) : groupLoading ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin text-secondary/60" />
                <p className="text-[9px] font-mono text-muted-foreground/30 uppercase tracking-[0.2em] animate-pulse">Syncing channel...</p>
              </div>
            ) : !groupMsgs || groupMsgs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground/30">
                <Zap className="w-8 h-8 opacity-20" />
                <p className="text-xs font-display font-bold text-muted-foreground/40 uppercase tracking-wider">No messages yet</p>
                <p className="text-[9px] font-mono text-muted-foreground/25 uppercase tracking-wider">Be the first to say something</p>
              </div>
            ) : (
              <div className="py-2">
                <AnimatePresence initial={false}>
                  {groupMsgs.map((msg, idx) => {
                    const isMe = msg.fromUser === username;
                    const prevMsg = idx > 0 ? groupMsgs[idx - 1] : null;
                    const msgDate = new Date(msg.createdAt || new Date());
                    const prevDate = prevMsg ? new Date(prevMsg.createdAt || new Date()) : null;
                    const showDivider = !prevDate || formatDay(msgDate) !== formatDay(prevDate);
                    return (
                      <div key={msg.id}>
                        {showDivider && <DateDivider label={formatDay(msgDate)} />}
                        <GroupMessage
                          msg={{ id: msg.id, fromUser: msg.fromUser, content: msg.content, createdAt: msg.createdAt as unknown as string | null }}
                          isMe={isMe}
                          prevMsg={prevMsg ? { fromUser: prevMsg.fromUser, createdAt: prevMsg.createdAt as unknown as string | null } : null}
                        />
                      </div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Input bar */}
          <div className="px-4 py-3 border-t border-white/8 flex-shrink-0" style={{ background: "hsl(240 25% 9%)" }}>
            <form
              onSubmit={handleSend}
              className="flex items-center gap-2"
            >
              <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus-within:border-secondary/40 focus-within:bg-secondary/5 transition-all duration-200">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={activeGroup ? `Message ${activeGroup.name}...` : "Select a group to chat..."}
                  data-testid="input-message"
                  disabled={!activeGroupId}
                  maxLength={500}
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-muted-foreground/40 outline-none disabled:opacity-40 font-body"
                />
              </div>
              <button
                type="submit"
                disabled={sendingGroup || !input.trim() || !activeGroupId}
                data-testid="button-send-message"
                className="w-9 h-9 flex items-center justify-center bg-secondary/80 text-secondary-foreground rounded-xl hover:bg-secondary disabled:opacity-40 disabled:hover:bg-secondary/80 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-secondary/10"
              >
                {sendingGroup ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreateGroup && (
          <UserPickerModal
            open={showCreateGroup}
            onClose={() => setShowCreateGroup(false)}
            title="New Group"
            subtitle="Name your group and pick members"
            allUsers={allUsers ?? []}
            currentUser={username}
            onRefresh={() => refetchUsers()}
            isRefreshing={isFetchingUsers}
            confirmLabel="Create"
            onConfirm={handleCreateGroup}
            isPending={creatingGroup}
            confirmColor="secondary"
          />
        )}
        {showAddMember && activeGroup && (
          <UserPickerModal
            open={showAddMember}
            onClose={() => setShowAddMember(false)}
            title="Add Members"
            subtitle={`to ${activeGroup.name}`}
            existingMembers={activeGroup.members}
            allUsers={allUsers ?? []}
            currentUser={username}
            onRefresh={() => refetchUsers()}
            isRefreshing={isFetchingUsers}
            confirmLabel="Add"
            onConfirm={handleAddMembers}
            isPending={addingMembers}
            confirmColor="accent"
          />
        )}
      </AnimatePresence>
    </Layout>
  );
}
