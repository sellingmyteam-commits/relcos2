import { useState } from "react";
import { UserRoundPen, Terminal } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ChatUsernameOverlay({ onComplete }: { onComplete: (username: string, siteUserId: number) => void }) {
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "taken" | "success">("idle");

  const validateUsername = (name: string) => {
    if (!name || name.length === 0) return false;
    if (name.length > 20) return false;
    if (/\s/.test(name)) return false;
    if (!/^[a-zA-Z0-9_]+$/.test(name)) return false;
    return true;
  };

  const handleSubmit = async () => {
    const clean = username.replace(/\s/g, "");
    if (!validateUsername(clean)) {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 1000);
      return;
    }
    try {
      const res = await fetch("/api/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: clean }),
      });
      if (res.status === 201) {
        const data = await res.json();
        setStatus("success");
        localStorage.setItem("chatUsername", clean);
        localStorage.setItem("siteUserId", String(data.id));
        setTimeout(() => onComplete(clean, data.id), 500);
      } else if (res.status === 200) {
        setStatus("taken");
        setTimeout(() => setStatus("idle"), 2000);
      } else {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 1000);
      }
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 1000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\s/g, "");
    if (val.length <= 20) setUsername(val);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{
          scale: 1,
          y: 0,
          x: status === "error" || status === "taken" ? [0, -10, 10, -10, 10, 0] : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 25,
          x: { duration: 0.4 },
        }}
        className={`relative w-full max-w-sm bg-black/60 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.6)] flex flex-col items-center gap-6 transition-colors duration-300 ${
          status === "success"
            ? "border-green-500/50 shadow-[0_0_40px_rgba(34,197,94,0.2)]"
            : status === "error" || status === "taken"
            ? "border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.2)]"
            : "border-secondary/20"
        }`}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div
            className={`p-4 rounded-full bg-white/5 border transition-colors duration-300 ${
              status === "success"
                ? "text-green-400 border-green-500/30"
                : status === "error" || status === "taken"
                ? "text-red-400 border-red-500/30"
                : "text-secondary border-secondary/30"
            }`}
          >
            <UserRoundPen className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase">
            CHOOSE YOUR NAME
          </h1>
          <p className="text-[11px] text-muted-foreground leading-relaxed max-w-[220px]">
            This is your username for the whole site. You can only set it once.
          </p>
          {status === "taken" ? (
            <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider animate-pulse">
              ⛔ Username already taken — try another
            </p>
          ) : (
            <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">
              Choose carefully — you can't change it
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
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              autoFocus
              data-testid="input-username-setup"
              className={`w-full h-12 bg-white/5 border-white/10 pl-10 text-center text-lg font-mono focus-visible:ring-0 focus-visible:ring-offset-0 transition-all duration-300 ${
                status === "success"
                  ? "border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                  : "focus:border-secondary focus:shadow-[0_0_20px_rgba(var(--secondary)/0.3)]"
              }`}
            />
          </div>
          <p className="text-[9px] text-center text-muted-foreground/50 font-mono">
            Letters, numbers, underscores only · Max 20 chars
          </p>

          <Button
            onClick={handleSubmit}
            disabled={status === "success" || status === "taken" || !username.trim()}
            data-testid="button-confirm-username"
            className={`w-full h-11 text-xs font-bold tracking-widest uppercase transition-all duration-300 relative overflow-hidden group ${
              status === "success"
                ? "bg-green-600 hover:bg-green-600"
                : status === "taken"
                ? "bg-red-700 hover:bg-red-700"
                : "bg-secondary hover:bg-secondary/90"
            }`}
          >
            <span className="relative z-10">
              {status === "success" ? "WELCOME!" : status === "taken" ? "NAME TAKEN" : "ENTER SITE"}
            </span>
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
