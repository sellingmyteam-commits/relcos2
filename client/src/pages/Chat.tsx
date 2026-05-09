import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/Layout";
import { useGroups, useGroupMessages, useCreateGroup, useSendGroupMessage, useLeaveGroup, type GroupWithMembers } from "@/hooks/use-groups";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Send, Loader2, Plus, X,
  Shield, UsersRound, LogOut, Check, RefreshCw
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
    <div className="relative flex-shrink-0">
      <div className={cn("rounded-full bg-gradient-to-br flex items-center justify-center font-bold text-white", sizeClass, colors[colorIdx])}>
        {name.slice(0, 1).toUpperCase()}
      </div>
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={cn("flex gap-3 px-4 py-0.5 group hover:bg-white/[0.02] rounded-lg transition-colors", isGrouped ? "mt-0.5" : "mt-3")}
    >
      {!isGrouped ? (
        <Avatar name={msg.fromUser} size="md" />
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
              {msg.fromUser}
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

function CreateGroupModal({ open, onClose, allUsers, currentUser, onRefresh, isRefreshing }: {
  open: boolean;
  onClose: () => void;
  allUsers: string[];
  currentUser: string;
  onRefresh: () => void;
  isRefreshing: boolean;
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
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users to add..."
              data-testid="input-group-search-users"
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent/50 placeholder:text-muted-foreground/40"
            />
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              data-testid="button-refresh-users-group"
              title="Refresh user list"
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-muted-foreground hover:text-white hover:bg-white/10 disabled:opacity-40 transition-all"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
            </button>
          </div>
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
                  <Avatar name={u} size="sm" />
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
  const groupParam = new URLSearchParams(window.location.search).get("group");

  const [activeGroupId, setActiveGroupId] = useState<number | null>(
    groupParam ? parseInt(groupParam, 10) : null
  );
  const [input, setInput] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [leaveConfirm, setLeaveConfirm] = useState<number | null>(null);

  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: groups } = useGroups(username);
  const { data: groupMsgs, isLoading: groupLoading } = useGroupMessages(activeGroupId, username);
  const { mutate: sendGroupMsg, isPending: sendingGroup } = useSendGroupMessage();
  const { mutate: leaveGroup } = useLeaveGroup();
  const { data: allUsers, refetch: refetchUsers, isFetching: isFetchingUsers } = useQuery<string[]>({
    queryKey: ["/api/users"],
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const activeGroup: GroupWithMembers | undefined =
    groups?.find(g => g.id === activeGroupId);

  useEffect(() => {
    if (messagesScrollRef.current) {
      messagesScrollRef.current.scrollTop = messagesScrollRef.current.scrollHeight;
    }
  }, [groupMsgs, activeGroupId]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [activeGroupId]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeGroupId) return;
    sendGroupMsg(
      { groupId: activeGroupId, fromUser: username, content: input },
      { onSuccess: () => setInput("") }
    );
  };

  const handleLeaveGroup = (groupId: number) => {
    leaveGroup({ groupId, username });
    setLeaveConfirm(null);
    if (activeGroupId === groupId) {
      setActiveGroupId(null);
    }
  };

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
                const isActive = activeGroupId === g.id;
                return (
                  <div key={g.id} className="relative mx-2 group">
                    <button
                      onClick={() => setActiveGroupId(g.id)}
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
          </div>

          {/* Username footer */}
          <div className="px-4 py-3 border-t border-white/10 bg-black/30 flex items-center gap-2.5">
            <Avatar name={username || "?"} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{username || "Anonymous"}</p>
            </div>
          </div>
        </div>

        {/* ── MAIN MESSAGES AREA ── */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0f0f1a]">

          {/* Group header */}
          <div className="px-5 py-3 border-b border-white/10 bg-black/20 flex items-center gap-3 flex-shrink-0">
            {activeGroup ? (
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
                  <UsersRound className="w-4 h-4 text-secondary/50" />
                </div>
                <div>
                  <span className="font-bold text-sm text-muted-foreground/60">Select a group</span>
                  <p className="text-[10px] text-muted-foreground/40 font-mono">Choose a group from the sidebar or create one</p>
                </div>
              </>
            )}
          </div>

          {/* Messages list */}
          <div
            ref={messagesScrollRef}
            className="flex-1 overflow-y-auto scroll-smooth py-2 relative"
          >
            {!activeGroupId ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 text-muted-foreground/40">
                <div className="w-20 h-20 rounded-full bg-secondary/5 border border-secondary/15 flex items-center justify-center">
                  <UsersRound className="w-9 h-9 opacity-30" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground/60">No group selected</p>
                  <p className="text-[10px] font-mono mt-1">Pick a group from the sidebar or create a new one</p>
                </div>
                <button
                  onClick={() => setShowCreateGroup(true)}
                  data-testid="button-create-group-empty"
                  className="flex items-center gap-2 px-4 py-2 bg-secondary/10 border border-secondary/30 text-secondary rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-secondary/20 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Group
                </button>
              </div>
            ) : groupLoading ? (
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
                placeholder={activeGroup ? `Message #${activeGroup.name}...` : "Select a group to chat..."}
                data-testid="input-chat-message"
                disabled={!activeGroupId}
                className="flex-1 bg-transparent py-3.5 text-sm focus:outline-none placeholder:text-muted-foreground/40 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={sendingGroup || !input.trim() || !activeGroupId}
                data-testid="button-send-message"
                className="flex-shrink-0 p-2 bg-secondary/80 text-secondary-foreground rounded-lg hover:bg-secondary disabled:opacity-40 disabled:hover:bg-secondary/80 transition-all shadow-lg shadow-secondary/10"
              >
                {sendingGroup ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>
        </div>

      </div>

      <CreateGroupModal
        open={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        allUsers={allUsers ?? []}
        currentUser={username}
        onRefresh={() => refetchUsers()}
        isRefreshing={isFetchingUsers}
      />
    </Layout>
  );
}
