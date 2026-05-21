import { useState } from "react";
import { Terminal, Database } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Status = "idle" | "loading" | "error" | "success" | "syncing";

export function ChatUsernameOverlay({ onComplete }: { onComplete: (username: string, siteUserId: number) => void }) {
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [syncStep, setSyncStep] = useState(0);

  const isShaking = status === "error";

  const reset = () => {
    setStatus("idle");
    setErrorMsg("");
  };

  const setError = (msg: string) => {
    setErrorMsg(msg);
    setStatus("error");
    setTimeout(reset, 2500);
  };

  const runSync = async (userId: number, name: string) => {
    setStatus("syncing");
    setSyncStep(0);
    await new Promise(r => setTimeout(r, 400));
    setSyncStep(1);
    await new Promise(r => setTimeout(r, 500));
    setSyncStep(2);
    await new Promise(r => setTimeout(r, 400));
    setSyncStep(3);
    await new Promise(r => setTimeout(r, 400));
    onComplete(name, userId);
  };

  const finish = async (data: { id: number; username: string }, msg: string) => {
    setSuccessMsg(msg);
    setStatus("success");
    localStorage.setItem("chatUsername", data.username);
    localStorage.setItem("siteUserId", String(data.id));
    await new Promise(r => setTimeout(r, 400));
    await runSync(data.id, data.username);
  };

  const handleSubmit = async () => {
    const cleanUsername = username.trim();
    if (!cleanUsername) return setError("Enter a username");
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) return setError("Letters, numbers, underscores only");
    if (cleanUsername.length < 2 || cleanUsername.length > 20) return setError("Username must be 2–20 characters");

    setStatus("loading");
    try {
      const res = await fetch("/api/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanUsername }),
      });

      if (res.ok) {
        const data = await res.json();
        return finish(data, data.created === false ? "Welcome back!" : "Account created!");
      }

      const data = await res.json().catch(() => ({}));
      setError(data.message || "Something went wrong");
    } catch {
      setError("Connection error, try again");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  const borderColor =
    status === "success" || status === "syncing" ? "border-green-500/50 shadow-[0_0_40px_rgba(34,197,94,0.2)]"
    : isShaking ? "border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.2)]"
    : "border-secondary/20";

  const syncMessages = [
    "Connecting to relc.os servers...",
    "Accessing relc.os user database and game data...",
    "Restoring your game progress...",
    "Done — loading your dashboard...",
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
    >
      <AnimatePresence mode="wait">
        {status === "syncing" ? (
          <motion.div
            key="syncing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="relative w-full max-w-sm bg-black/60 backdrop-blur-xl border border-green-500/30 p-10 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.6)] flex flex-col items-center gap-6"
          >
            <div className="p-4 rounded-full bg-green-500/10 border border-green-500/30">
              <Database className="w-8 h-8 text-green-400 animate-pulse" />
            </div>

            <div className="text-center space-y-1">
              <p className="text-white font-black tracking-tighter text-lg uppercase">Loading Your Data</p>
              <p className="text-[11px] text-green-400/70 font-mono leading-relaxed">
                {syncMessages[syncStep] ?? syncMessages[syncMessages.length - 1]}
              </p>
            </div>

            <div className="w-full space-y-2">
              {syncMessages.map((msg, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-all duration-300 ${
                    i < syncStep ? "bg-green-400" : i === syncStep ? "bg-green-400 animate-pulse" : "bg-white/10"
                  }`} />
                  <span className={`text-[10px] font-mono transition-colors duration-300 ${
                    i < syncStep ? "text-green-400/70" : i === syncStep ? "text-green-300" : "text-white/20"
                  }`}>{msg}</span>
                </div>
              ))}
            </div>

            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-green-400 rounded-full"
                animate={{ width: `${((syncStep + 1) / syncMessages.length) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ scale: 0.9, y: 20 }}
            animate={{
              scale: 1,
              y: 0,
              x: isShaking ? [0, -10, 10, -10, 10, 0] : 0,
            }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25, x: { duration: 0.4 } }}
            className={`relative w-full max-w-sm bg-black/60 backdrop-blur-xl border p-8 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.6)] flex flex-col items-center gap-6 transition-colors duration-300 ${borderColor}`}
          >
            <div className="flex flex-col items-center gap-3 text-center">
              <div className={`p-4 rounded-full bg-white/5 border transition-colors duration-300 ${
                status === "success" ? "text-green-400 border-green-500/30"
                : isShaking ? "text-red-400 border-red-500/30"
                : "text-secondary border-secondary/30"
              }`}>
                <Terminal className="w-7 h-7" />
              </div>

              <h1 className="text-2xl font-black tracking-tighter text-white uppercase">
                ENTER USERNAME
              </h1>
              <p className="text-[11px] text-muted-foreground leading-relaxed max-w-[260px]">
                Pick a username to get started. We'll create your account or load your existing one.
              </p>

              {errorMsg && (
                <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider animate-pulse" data-testid="text-auth-error">
                  ⚠ {errorMsg}
                </p>
              )}
              {status === "success" && (
                <p className="text-[10px] text-green-400 font-bold uppercase tracking-wider" data-testid="text-auth-success">
                  ✓ {successMsg}
                </p>
              )}
            </div>

            <div className="w-full space-y-3">
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-secondary transition-colors">
                  <Terminal className="w-4 h-4" />
                </div>
                <Input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s/g, "").slice(0, 20))}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  data-testid="input-username"
                  className="w-full h-11 bg-white/5 border-white/10 pl-10 font-mono focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>

              <p className="text-[9px] text-center text-muted-foreground/50 font-mono">
                Letters, numbers, underscores · 2–20 chars
              </p>

              <Button
                onClick={handleSubmit}
                disabled={status === "loading" || status === "success" || status === "syncing"}
                data-testid="button-submit-auth"
                className={`w-full h-11 text-xs font-bold tracking-widest uppercase transition-all duration-300 relative overflow-hidden group ${
                  status === "success" ? "bg-green-600 hover:bg-green-600"
                  : isShaking ? "bg-red-700 hover:bg-red-700"
                  : "bg-secondary hover:bg-secondary/90"
                }`}
              >
                <span className="relative z-10">
                  {status === "loading" ? "PLEASE WAIT..."
                   : status === "success" ? "WELCOME!"
                   : "CONTINUE"}
                </span>
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </Button>

              <p className="text-[9px] text-center text-muted-foreground/40 font-mono uppercase tracking-wider pt-1">
                No password needed
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
