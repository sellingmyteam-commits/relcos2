import { useState } from "react";
import { Lock, Terminal, Eye, EyeOff, UserPlus, LogIn, Database } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cloudPullSave } from "@/lib/saveSystem";

type Mode = "login" | "register";
type Status = "idle" | "loading" | "error" | "taken" | "bad_password" | "success" | "syncing";

export function ChatUsernameOverlay({ onComplete }: { onComplete: (username: string, siteUserId: number) => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [syncStep, setSyncStep] = useState(0);

  const isShaking = status === "error" || status === "taken" || status === "bad_password";

  const reset = () => {
    setStatus("idle");
    setErrorMsg("");
  };

  const setError = (msg: string, type: Status = "error") => {
    setErrorMsg(msg);
    setStatus(type);
    setTimeout(reset, 2500);
  };

  const runSync = async (userId: number, name: string) => {
    setStatus("syncing");
    setSyncStep(0);

    await new Promise(r => setTimeout(r, 400));
    setSyncStep(1);
    await new Promise(r => setTimeout(r, 500));
    setSyncStep(2);

    await cloudPullSave(userId);

    setSyncStep(3);
    await new Promise(r => setTimeout(r, 400));

    onComplete(name, userId);
  };

  const handleSubmit = async () => {
    const cleanUsername = username.trim();
    if (!cleanUsername) return setError("Enter a username");
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) return setError("Letters, numbers, underscores only");
    if (cleanUsername.length < 2 || cleanUsername.length > 20) return setError("2–20 characters");
    if (!password) return setError("Enter a password");

    if (mode === "register") {
      if (password.length < 4) return setError("Password must be at least 4 characters");
      if (password !== confirmPassword) return setError("Passwords don't match");
    }

    setStatus("loading");
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanUsername, password }),
      });
      const data = await res.json();

      if (res.status === 409) return setError("Username already taken", "taken");
      if (res.status === 401) return setError("Wrong username or password", "bad_password");
      if (!res.ok) return setError(data.message || "Something went wrong");

      setStatus("success");
      localStorage.setItem("chatUsername", data.username);
      localStorage.setItem("siteUserId", String(data.id));

      await new Promise(r => setTimeout(r, 400));
      await runSync(data.id, data.username);
    } catch {
      setError("Connection error, try again");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setStatus("idle");
    setErrorMsg("");
    setPassword("");
    setConfirmPassword("");
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
                {mode === "login" ? <LogIn className="w-7 h-7" /> : <UserPlus className="w-7 h-7" />}
              </div>

              <h1 className="text-2xl font-black tracking-tighter text-white uppercase">
                {mode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}
              </h1>
              <p className="text-[11px] text-muted-foreground leading-relaxed max-w-[240px]">
                {mode === "login"
                  ? "Enter your username and password to access the site."
                  : "Pick a username and password to create your account."}
              </p>

              {errorMsg && (
                <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider animate-pulse">
                  ⚠ {errorMsg}
                </p>
              )}
              {status === "success" && (
                <p className="text-[10px] text-green-400 font-bold uppercase tracking-wider">
                  ✓ {mode === "login" ? "Welcome back!" : "Account created!"}
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

              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-secondary transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <Input
                  type={showPass ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  data-testid="input-password"
                  className="w-full h-11 bg-white/5 border-white/10 pl-10 pr-10 font-mono focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {mode === "register" && (
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-secondary transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <Input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    data-testid="input-confirm-password"
                    className="w-full h-11 bg-white/5 border-white/10 pl-10 pr-10 font-mono focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              )}

              {mode === "register" && (
                <p className="text-[9px] text-center text-muted-foreground/50 font-mono">
                  Letters, numbers, underscores · 2–20 chars · Password min 4 chars
                </p>
              )}

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
                   : mode === "login" ? "LOG IN"
                   : "CREATE ACCOUNT"}
                </span>
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </Button>

              <div className="flex items-center gap-3 pt-1">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[9px] text-muted-foreground/40 font-mono uppercase tracking-wider">
                  {mode === "login" ? "New here?" : "Already have an account?"}
                </span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <button
                onClick={() => switchMode(mode === "login" ? "register" : "login")}
                data-testid="button-switch-auth-mode"
                className="w-full py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-muted-foreground hover:text-white hover:bg-white/10 hover:border-white/20 transition-all tracking-wider uppercase"
              >
                {mode === "login" ? "Create an Account" : "Back to Login"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
