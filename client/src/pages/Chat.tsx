import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/Layout";
import { useGroups, useGroupMessages, useCreateGroup, useSendGroupMessage, useLeaveGroup, useInviteGroupMembers, useGroupInvites, useAcceptGroupInvite, useDeclineGroupInvite, type GroupWithMembers } from "@/hooks/use-groups";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Send, Loader2, Plus, X,
  UsersRound, LogOut, Check, RefreshCw, UserPlus, Zap, MessageSquare, Radio, Bell
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

function MuteScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"glitch" | "returning">("glitch");
  const [glitchTick, setGlitchTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setGlitchTick(t => t + 1), 80);
    const switchTimer = setTimeout(() => setPhase("returning"), 3200);
    const doneTimer = setTimeout(() => onDone(), 5200);
    return () => { clearInterval(interval); clearTimeout(switchTimer); clearTimeout(doneTimer); };
  }, [onDone]);

  const glitchStyle = (): React.CSSProperties => {
    if (glitchTick % 3 !== 0) return {};
    const x = (Math.random() - 0.5) * 18;
    const y = (Math.random() - 0.5) * 8;
    const skew = (Math.random() - 0.5) * 6;
    return { transform: `translate(${x}px, ${y}px) skewX(${skew}deg)` };
  };

  const scanlines = Array.from({ length: 18 });

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-black">
      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        {scanlines.map((_, i) => (
          <div key={i} className="absolute w-full" style={{ top: `${(i / 18) * 100}%`, height: "1px", background: "rgba(255,0,60,0.08)" }} />
        ))}
      </div>

      {/* Noise overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 2, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E\")", opacity: glitchTick % 4 === 0 ? 0.18 : 0.06 }}
      />

      {/* Red flash stripes */}
      {glitchTick % 5 === 0 && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 3, background: `linear-gradient(${Math.random() * 360}deg, rgba(255,0,60,0.12), transparent 60%)` }} />
      )}

      {/* Horizontal glitch bars */}
      {glitchTick % 3 === 0 && (
        <div className="absolute pointer-events-none" style={{
          zIndex: 4,
          top: `${Math.random() * 80 + 10}%`,
          left: 0, right: 0,
          height: `${Math.random() * 12 + 2}px`,
          background: `rgba(255,0,60,${Math.random() * 0.35 + 0.05})`,
          transform: `translateX(${(Math.random() - 0.5) * 60}px)`
        }} />
      )}

      {/* Main content */}
      <div className="relative text-center px-8 select-none" style={{ zIndex: 10 }}>
        <AnimatePresence mode="wait">
          {phase === "glitch" ? (
            <motion.div
              key="muted"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              style={glitchStyle()}
            >
              {/* Pseudo-element glitch layers */}
              <div className="relative">
                <span className="absolute inset-0 flex items-center justify-center text-5xl font-black font-display tracking-[0.15em] uppercase"
                  style={{ color: "rgba(0,255,249,0.4)", transform: `translate(${glitchTick % 2 === 0 ? -4 : 3}px, 0)`, filter: "blur(1px)" }}>
                  YOU HAVE BEEN MUTED
                </span>
                <span className="absolute inset-0 flex items-center justify-center text-5xl font-black font-display tracking-[0.15em] uppercase"
                  style={{ color: "rgba(255,0,60,0.4)", transform: `translate(${glitchTick % 2 === 0 ? 4 : -3}px, 2px)`, filter: "blur(1px)" }}>
                  YOU HAVE BEEN MUTED
                </span>
                <h1 className="relative text-5xl font-black font-display tracking-[0.15em] uppercase"
                  style={{ color: "#ff003c", textShadow: "0 0 30px #ff003c, 0 0 60px #ff003c88, 0 0 4px #fff" }}>
                  YOU HAVE BEEN MUTED
                </h1>
              </div>

              <motion.div
                className="mt-6 text-xs font-mono tracking-[0.4em] uppercase"
                animate={{ opacity: [1, 0.2, 1, 0.5, 1] }}
                transition={{ duration: 0.4, repeat: Infinity }}
                style={{ color: "#ff003c99" }}
              >
                ACCESS DENIED // COMMS BLOCKED
              </motion.div>

              <div className="mt-4 w-64 mx-auto h-0.5 bg-red-600/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-red-500 rounded-full"
                  style={{ boxShadow: "0 0 8px #ff003c" }}
                  animate={{ width: ["0%", "100%"] }}
                  transition={{ duration: 3.2, ease: "linear" }}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="returning"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.h2
                className="text-3xl font-black font-display tracking-[0.2em] uppercase"
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 0.6, repeat: Infinity }}
                style={{ color: "#00fff9", textShadow: "0 0 20px #00fff9, 0 0 40px #00fff988" }}
              >
                RETURNING TO HOME BASE
              </motion.h2>
              <div className="mt-5 flex justify-center gap-1.5">
                {[0, 1, 2, 3, 4].map(i => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-cyan-400"
                    style={{ boxShadow: "0 0 6px #00fff9" }}
                    animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                    transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.12 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

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

function GroupMessage({ msg, isMe, prevMsg }: {
  msg: { id: number; fromUser: string; content: string; createdAt: string | Date | null };
  isMe: boolean;
  prevMsg?: { fromUser: string; createdAt: string | Date | null } | null;
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

function UserPickerModal({ open, onClose, title, subtitle, existingMembers = [], allUsers, currentUser, onRefresh, isRefreshing, confirmLabel, onConfirm, isPending, confirmColor = "cyan" }: {
  open: boolean; onClose: () => void; title: string; subtitle: string;
  existingMembers?: string[]; allUsers: string[]; currentUser: string;
  onRefresh: () => void; isRefreshing: boolean; confirmLabel: string;
  onConfirm: (selected: string[]) => void; isPending: boolean; confirmColor?: "cyan" | "pink";
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [groupName, setGroupName] = useState("");
  const needsName = title === "New Group";

  useEffect(() => {
    if (!open) { setSelected(new Set()); setSearch(""); setGroupName(""); }
  }, [open]);

  if (!open) return null;

  const color = confirmColor === "pink" ? "#ff00c1" : "#00fff9";
  const excluded = new Set([...existingMembers, currentUser]);
  const candidates = allUsers.filter(u => !excluded.has(u) && u.toLowerCase().includes(search.toLowerCase())).slice(0, 100);

  const toggle = (u: string) => setSelected(prev => { const n = new Set(prev); n.has(u) ? n.delete(u) : n.add(u); return n; });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }} onClick={onClose} data-testid="modal-user-picker">
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 12 }}
        transition={{ type: "spring", stiffness: 420, damping: 30 }}
        className="w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden rounded-2xl border"
        style={{
          background: "rgba(5,8,20,0.92)",
          backdropFilter: "blur(24px)",
          borderColor: `${color}33`,
          boxShadow: `0 0 60px ${color}18, 0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 ${color}22`
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-center gap-3 border-b" style={{ borderColor: `${color}22` }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18`, border: `1px solid ${color}40` }}>
            {confirmColor === "pink" ? <UserPlus className="w-4 h-4" style={{ color }} /> : <UsersRound className="w-4 h-4" style={{ color }} />}
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-display font-black uppercase tracking-wider text-white">{title}</h2>
            <p className="text-[10px] font-mono mt-0.5" style={{ color: `${color}80` }}>{subtitle}</p>
          </div>
          <button onClick={onClose} data-testid="button-close-modal" className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Inputs */}
        <div className="px-5 py-3 space-y-2.5 border-b" style={{ borderColor: `${color}15` }}>
          {needsName && (
            <input type="text" value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Group name..." data-testid="input-group-name" maxLength={40}
              className="w-full rounded-lg px-3 py-2.5 text-sm text-white outline-none font-mono placeholder:text-white/20 transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${color}30` }}
            />
          )}
          <div className="flex gap-2">
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." data-testid="input-user-search"
              className="flex-1 rounded-lg px-3 py-2 text-xs text-white outline-none font-mono placeholder:text-white/20"
              style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${color}25` }}
            />
            <button type="button" onClick={onRefresh} disabled={isRefreshing} data-testid="button-refresh-users" className="p-2 rounded-lg text-white/30 hover:text-white disabled:opacity-40 transition-all" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
            </button>
          </div>
          {selected.size > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {Array.from(selected).map(u => (
                <span key={u} data-testid={`chip-selected-${u}`} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono" style={{ background: `${color}18`, border: `1px solid ${color}40`, color }}>
                  {u} <button onClick={() => toggle(u)} data-testid={`button-remove-chip-${u}`}><X className="w-2.5 h-2.5" /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto min-h-0 p-2">
          {candidates.length === 0 ? (
            <div className="text-center py-8 text-xs text-white/25 font-mono">No users found</div>
          ) : candidates.map(u => {
            const isSel = selected.has(u);
            return (
              <button key={u} onClick={() => toggle(u)} data-testid={`button-toggle-user-${u}`}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all mb-0.5"
                style={isSel ? { background: `${color}15`, border: `1px solid ${color}30` } : { border: "1px solid transparent" }}
              >
                <Avatar name={u} size="sm" />
                <span className="flex-1 text-xs font-medium text-white truncate">{u}</span>
                <div className="w-4 h-4 rounded border flex items-center justify-center transition-all" style={isSel ? { background: color, borderColor: color } : { borderColor: "rgba(255,255,255,0.2)" }}>
                  {isSel && <Check className="w-3 h-3 text-black" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t flex items-center justify-between" style={{ borderColor: `${color}15`, background: "rgba(0,0,0,0.3)" }}>
          <span className="text-[10px] font-mono text-white/30">{selected.size} selected</span>
          <button
            onClick={() => onConfirm(needsName ? [groupName, ...Array.from(selected)] : Array.from(selected))}
            disabled={(needsName && !groupName.trim()) || selected.size === 0 || isPending}
            data-testid="button-confirm-pick"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-black disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
            style={{ background: `linear-gradient(135deg, ${color}, ${confirmColor === "pink" ? "#bf5fff" : "#0080ff"})`, boxShadow: `0 0 20px ${color}40` }}
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function Chat() {
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const username = localStorage.getItem("chatUsername") || "";
  const userId = localStorage.getItem("siteUserId");
  const groupParam = new URLSearchParams(window.location.search).get("group");

  const [activeGroupId, setActiveGroupId] = useState<number | null>(groupParam ? parseInt(groupParam, 10) : null);
  const [input, setInput] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [leaveConfirm, setLeaveConfirm] = useState<number | null>(null);
  const [showInvites, setShowInvites] = useState(false);
  const [inviteSentMsg, setInviteSentMsg] = useState<string | null>(null);
  const [showMuteScreen, setShowMuteScreen] = useState(false);

  const { data: userStatus } = useQuery<{ isMuted: boolean }>({
    queryKey: ["/api/user/status/id", userId],
    queryFn: async () => {
      if (!userId) return { isMuted: false };
      const res = await fetch(`/api/user/status/id/${userId}`);
      if (!res.ok) return { isMuted: false };
      return res.json();
    },
    enabled: !!userId,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (userStatus?.isMuted) setShowMuteScreen(true);
  }, [userStatus?.isMuted]);

  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: groups } = useGroups(username);
  const { data: groupMsgs, isLoading: groupLoading } = useGroupMessages(activeGroupId, username);
  const { mutate: sendGroupMsg, isPending: sendingGroup } = useSendGroupMessage();
  const { mutate: leaveGroup } = useLeaveGroup();
  const { mutate: createGroup, isPending: creatingGroup } = useCreateGroup();
  const { mutate: inviteMembers, isPending: invitingMembers } = useInviteGroupMembers();
  const { data: pendingInvites, refetch: refetchInvites } = useGroupInvites(username);
  const { mutate: acceptInvite } = useAcceptGroupInvite();
  const { mutate: declineInvite } = useDeclineGroupInvite();
  const { data: allUsers, refetch: refetchUsers, isFetching: isFetchingUsers } = useQuery<string[]>({
    queryKey: ["/api/users"],
    refetchInterval: 60000,
    refetchOnWindowFocus: false,
    staleTime: 30000,
  });

  const activeGroup: GroupWithMembers | undefined = groups?.find(g => g.id === activeGroupId);
  const inviteCount = pendingInvites?.length ?? 0;

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

  const handleInviteMembers = (usernames: string[]) => {
    if (!activeGroupId) return;
    inviteMembers({ groupId: activeGroupId, usernames, invitedBy: username }, {
      onSuccess: (data) => {
        setShowAddMember(false);
        const count = data?.invited ?? usernames.length;
        setInviteSentMsg(`Invite sent to ${count} ${count === 1 ? "user" : "users"}`);
        setTimeout(() => setInviteSentMsg(null), 3500);
      }
    });
  };

  const handleAccept = (inviteId: number, groupId: number) => {
    acceptInvite({ inviteId, username }, {
      onSuccess: () => {
        setActiveGroupId(groupId);
        setShowInvites(false);
        refetchInvites();
        queryClient.invalidateQueries({ queryKey: ["/api/groups/user", username] });
      }
    });
  };

  const handleDecline = (inviteId: number) => {
    declineInvite({ inviteId, username }, { onSuccess: () => refetchInvites() });
  };

  if (showMuteScreen) {
    return <MuteScreen onDone={() => navigate("/")} />;
  }

  return (
    <Layout noContainer>
      <div className="flex h-full">

        {/* ── LEFT SIDEBAR ── */}
        <div
          className="w-60 flex-shrink-0 flex flex-col overflow-hidden"
          style={{
            background: "rgba(2,6,18,0.88)",
            backdropFilter: "blur(24px)",
            borderRight: "1px solid rgba(0,255,249,0.12)",
          }}
        >
          {/* Sidebar header */}
          <div className="px-4 py-4 flex items-center gap-2.5 flex-shrink-0" style={{ borderBottom: "1px solid rgba(0,255,249,0.1)" }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,255,249,0.12)", border: "1px solid rgba(0,255,249,0.3)", boxShadow: "0 0 12px rgba(0,255,249,0.2)" }}>
              <Radio className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-display font-black text-white uppercase tracking-widest leading-none">COMMS</p>
              <p className="text-[8px] font-mono text-cyan-400/50 uppercase tracking-[0.2em] mt-0.5">SECURE CHANNEL</p>
            </div>

            {/* Notifications bell icon */}
            <button
              onClick={() => setShowInvites(v => !v)}
              data-testid="button-notifications-bell"
              title="Group invites"
              className="relative p-1.5 rounded-lg transition-all"
              style={showInvites
                ? { background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.35)" }
                : { border: "1px solid transparent" }
              }
            >
              <Bell className={cn("w-4 h-4 transition-colors", inviteCount > 0 ? "text-purple-400" : "text-white/25 hover:text-white/50")} />
              {inviteCount > 0 && (
                <span
                  data-testid="badge-invite-count"
                  className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full text-[9px] font-black text-black flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #a855f7, #ec4899)", boxShadow: "0 0 8px rgba(168,85,247,0.7)" }}
                >
                  {inviteCount > 9 ? "9+" : inviteCount}
                </span>
              )}
            </button>
          </div>

          {/* Inline invite panel — slides in below header */}
          <AnimatePresence>
            {showInvites && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden flex-shrink-0"
                style={{ borderBottom: "1px solid rgba(168,85,247,0.2)" }}
              >
                <div className="px-3 pt-3 pb-3 space-y-2" style={{ background: "rgba(168,85,247,0.06)" }}>
                  <div className="flex items-center gap-2">
                    <UsersRound className="w-3 h-3 text-purple-400/60" />
                    <span className="text-[9px] font-display font-bold text-purple-400/60 uppercase tracking-[0.18em]">Group Invites</span>
                    {inviteCount > 0 && (
                      <span className="ml-auto text-[8px] font-mono text-purple-400/40">{inviteCount} pending</span>
                    )}
                  </div>

                  {!pendingInvites || inviteCount === 0 ? (
                    <div className="py-4 flex flex-col items-center gap-2">
                      <Bell className="w-5 h-5 text-white/10" />
                      <p className="text-[9px] font-mono text-white/20 text-center">No pending invites</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
                      <AnimatePresence>
                        {pendingInvites.map(invite => (
                          <motion.div
                            key={invite.id}
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                            data-testid={`invite-item-${invite.id}`}
                            className="rounded-xl p-2.5 space-y-2"
                            style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)" }}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 font-black text-[9px] text-black"
                                style={{ background: "linear-gradient(135deg, #a855f7, #ec4899)" }}
                              >
                                {invite.groupName.slice(0, 1).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-bold text-white truncate leading-tight">{invite.groupName}</p>
                                <p className="text-[9px] text-purple-300/50 font-mono truncate">from {invite.invitedBy}</p>
                              </div>
                            </div>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleAccept(invite.id, invite.groupId)}
                                data-testid={`button-accept-invite-panel-${invite.id}`}
                                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[9px] font-black text-green-400 transition-colors hover:bg-green-500/20"
                                style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)" }}
                              >
                                <Check className="w-3 h-3" />
                                Accept
                              </button>
                              <button
                                onClick={() => handleDecline(invite.id)}
                                data-testid={`button-decline-invite-panel-${invite.id}`}
                                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[9px] font-black text-white/35 transition-colors hover:text-red-400 hover:bg-red-500/10"
                                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                              >
                                <X className="w-3 h-3" />
                                Decline
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Groups list */}
          <div className="flex-1 overflow-y-auto min-h-0 py-3 px-2 space-y-0.5">
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[8px] font-display font-bold text-white/25 uppercase tracking-[0.2em]">Groups</span>
              <button onClick={() => setShowCreateGroup(true)} data-testid="button-new-group" title="New group"
                className="p-1 rounded-md text-white/20 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all">
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {groups && groups.length > 0 ? groups.map(g => {
              const isActive = activeGroupId === g.id;
              return (
                <div key={g.id} className="relative group/item">
                  <button
                    onClick={() => setActiveGroupId(g.id)}
                    data-testid={`button-group-${g.id}`}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-left"
                    style={isActive ? {
                      background: "rgba(0,255,249,0.1)",
                      border: "1px solid rgba(0,255,249,0.25)",
                      boxShadow: "0 0 16px rgba(0,255,249,0.08)",
                    } : { border: "1px solid transparent" }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-black text-xs"
                      style={isActive ? {
                        background: "linear-gradient(135deg, #00fff9, #0080ff)",
                        boxShadow: "0 0 12px rgba(0,255,249,0.4)",
                        color: "#000",
                      } : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.1)" }}>
                      {g.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs font-bold truncate", isActive ? "text-white" : "text-white/50")}>{g.name}</p>
                      <p className="text-[9px] font-mono truncate" style={{ color: isActive ? "rgba(0,255,249,0.5)" : "rgba(255,255,255,0.2)" }}>{g.members.length} members</p>
                    </div>
                    {isActive && (
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#00fff9", boxShadow: "0 0 6px #00fff9" }} />
                    )}
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); setLeaveConfirm(leaveConfirm === g.id ? null : g.id); }}
                    data-testid={`button-leave-group-${g.id}`}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    title="Leave group"
                  >
                    <LogOut className="w-3 h-3" />
                  </button>
                  {leaveConfirm === g.id && (
                    <div className="absolute left-2 right-2 top-full z-50 mt-1 p-2.5 rounded-xl border flex items-center gap-2"
                      style={{ background: "rgba(0,0,0,0.95)", backdropFilter: "blur(16px)", borderColor: "rgba(255,60,60,0.3)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
                      <span className="text-[10px] text-red-400/80 flex-1 font-mono">Leave group?</span>
                      <button onClick={() => handleLeaveGroup(g.id)} data-testid={`button-confirm-leave-${g.id}`} className="px-2.5 py-1 rounded-lg text-[9px] font-black text-white uppercase" style={{ background: "rgba(255,60,60,0.2)", border: "1px solid rgba(255,60,60,0.4)" }}>Yes</button>
                      <button onClick={() => setLeaveConfirm(null)} className="px-2.5 py-1 rounded-lg text-[9px] text-white/50 hover:text-white" style={{ background: "rgba(255,255,255,0.05)" }}>No</button>
                    </div>
                  )}
                </div>
              );
            }) : (
              <div className="px-3 py-8 flex flex-col items-center gap-3 text-center">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(0,255,249,0.06)", border: "1px solid rgba(0,255,249,0.12)" }}>
                  <UsersRound className="w-5 h-5 text-cyan-400/30" />
                </div>
                <div>
                  <p className="text-[9px] font-mono text-white/25 uppercase tracking-wider mb-2">No groups yet</p>
                  <button onClick={() => setShowCreateGroup(true)} className="text-[9px] font-black font-mono text-cyan-400/60 hover:text-cyan-400 uppercase tracking-wider transition-colors">
                    + Create one
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User footer */}
          <div className="px-4 py-3 flex items-center gap-2.5 flex-shrink-0" style={{ borderTop: "1px solid rgba(0,255,249,0.1)", background: "rgba(0,0,0,0.3)" }}>
            <Avatar name={username || "?"} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-white truncate">{username || "Anonymous"}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" style={{ boxShadow: "0 0 4px #4ade80" }} />
                <span className="text-[8px] font-mono text-green-400/60 uppercase tracking-wider">Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── MAIN AREA ── */}
        <div className="flex-1 flex flex-col min-w-0" style={{ background: "rgba(0,0,0,0.25)" }}>

          {/* Group header */}
          <div
            className="px-6 py-4 flex items-center gap-4 flex-shrink-0 relative overflow-hidden"
            style={{
              background: "rgba(2,6,18,0.75)",
              backdropFilter: "blur(20px)",
              borderBottom: "1px solid rgba(0,255,249,0.12)",
              boxShadow: "0 1px 0 rgba(0,255,249,0.06)"
            }}
          >
            <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
              style={{ backgroundImage: "repeating-linear-gradient(0deg, #fff 0, #fff 1px, transparent 1px, transparent 3px)" }} />

            {activeGroup ? (
              <>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, rgba(0,255,249,0.2), rgba(0,128,255,0.2))", border: "1px solid rgba(0,255,249,0.3)", boxShadow: "0 0 20px rgba(0,255,249,0.12)" }}>
                  <UsersRound className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-display font-black uppercase tracking-wider text-white truncate" style={{ textShadow: "0 0 20px rgba(0,255,249,0.4)" }}>
                    {activeGroup.name}
                  </h2>
                  <p className="text-[10px] font-mono text-white/35 mt-0.5 truncate">
                    <span style={{ color: "#00fff9" }}>●</span> {activeGroup.members.length} {activeGroup.members.length === 1 ? "member" : "members"} — {activeGroup.members.join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <AnimatePresence>
                    {inviteSentMsg && (
                      <motion.span
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-[10px] font-mono text-green-400 whitespace-nowrap"
                        data-testid="text-invite-sent"
                      >
                        ✓ {inviteSentMsg}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <button
                    onClick={() => setShowAddMember(true)}
                    data-testid="button-add-member"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
                    style={{ background: "rgba(255,0,193,0.12)", border: "1px solid rgba(255,0,193,0.3)", color: "#ff00c1", boxShadow: "0 0 12px rgba(255,0,193,0.1)" }}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Invite
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <MessageSquare className="w-5 h-5 text-white/20" />
                </div>
                <div>
                  <h2 className="text-sm font-display font-bold text-white/30 uppercase tracking-wider">Select a group</h2>
                  <p className="text-[10px] font-mono text-white/20 mt-0.5">Choose from the sidebar or create one</p>
                </div>
              </>
            )}
          </div>

          {/* Messages area */}
          <div ref={messagesScrollRef} className="flex-1 overflow-y-auto scroll-smooth relative min-h-0">
            {!activeGroupId ? (
              <div className="h-full flex flex-col items-center justify-center gap-6 px-8">
                <div className="relative">
                  <div className="w-24 h-24 rounded-3xl flex items-center justify-center" style={{ background: "rgba(0,255,249,0.06)", border: "1px solid rgba(0,255,249,0.15)", boxShadow: "0 0 40px rgba(0,255,249,0.08)" }}>
                    <UsersRound className="w-10 h-10 text-cyan-400/30" />
                  </div>
                  <div className="absolute -inset-2 rounded-3xl pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(0,255,249,0.06), transparent 70%)" }} />
                </div>
                <div className="text-center">
                  <p className="text-lg font-display font-black text-white/60 uppercase tracking-wider mb-2">No Channel Selected</p>
                  <p className="text-xs font-mono text-white/25 uppercase tracking-wider">Open a group or create a new one to start</p>
                </div>
                <button
                  onClick={() => setShowCreateGroup(true)}
                  data-testid="button-create-group-empty"
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                  style={{ background: "linear-gradient(135deg, rgba(0,255,249,0.15), rgba(0,128,255,0.15))", border: "1px solid rgba(0,255,249,0.3)", color: "#00fff9", boxShadow: "0 0 24px rgba(0,255,249,0.15)" }}
                >
                  <Plus className="w-4 h-4" />
                  New Group
                </button>
              </div>
            ) : groupLoading ? (
              <div className="h-full flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-400/40" />
                <p className="text-[9px] font-mono text-white/25 uppercase tracking-[0.2em] animate-pulse">Establishing connection...</p>
              </div>
            ) : !groupMsgs || groupMsgs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-4">
                <Zap className="w-10 h-10 text-white/10" />
                <div className="text-center">
                  <p className="text-sm font-display font-bold text-white/30 uppercase tracking-wider">Channel is empty</p>
                  <p className="text-[10px] font-mono text-white/20 mt-1">Start the conversation</p>
                </div>
              </div>
            ) : (
              <div className="pb-4 pt-2">
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
          <div className="px-4 py-4 flex-shrink-0" style={{ background: "rgba(2,6,18,0.8)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(0,255,249,0.1)" }}>
            <form onSubmit={handleSend} className="flex items-center gap-3">
              <div
                className="flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,255,249,0.18)" }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={activeGroup ? `Message ${activeGroup.name}...` : "Select a group to chat..."}
                  data-testid="input-message"
                  disabled={!activeGroupId}
                  maxLength={500}
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/20 outline-none disabled:opacity-40"
                />
                {input && (
                  <span className="text-[9px] font-mono text-white/20">{500 - input.length}</span>
                )}
              </div>
              <button
                type="submit"
                disabled={sendingGroup || !input.trim() || !activeGroupId}
                data-testid="button-send-message"
                className="w-11 h-11 flex items-center justify-center rounded-2xl text-black font-black transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
                style={{ background: "linear-gradient(135deg, #00fff9, #0080ff)", boxShadow: "0 0 20px rgba(0,255,249,0.35)" }}
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
            open={showCreateGroup} onClose={() => setShowCreateGroup(false)}
            title="New Group" subtitle="Name your group and pick members"
            allUsers={allUsers ?? []} currentUser={username}
            onRefresh={() => refetchUsers()} isRefreshing={isFetchingUsers}
            confirmLabel="Create" onConfirm={handleCreateGroup}
            isPending={creatingGroup} confirmColor="cyan"
          />
        )}
        {showAddMember && activeGroup && (
          <UserPickerModal
            open={showAddMember} onClose={() => setShowAddMember(false)}
            title="Invite Members" subtitle={`to ${activeGroup.name}`}
            existingMembers={activeGroup.members}
            allUsers={allUsers ?? []} currentUser={username}
            onRefresh={() => refetchUsers()} isRefreshing={isFetchingUsers}
            confirmLabel="Send Invites" onConfirm={handleInviteMembers}
            isPending={invitingMembers} confirmColor="pink"
          />
        )}
      </AnimatePresence>
    </Layout>
  );
}
