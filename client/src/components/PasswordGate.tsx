import { useState, useEffect } from "react";
import { KeyRound, Terminal, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUnlock = async () => {
    if (code === "8945") {
      setStatus("success");
      setIsSubmitting(true);
      setTimeout(() => {
        onUnlock();
      }, 800);
    } else {
      setStatus("error");
      setTimeout(() => {
        setStatus("idle");
        setCode("");
      }, 1000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleUnlock();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505] p-4 overflow-hidden"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-500/10 blur-[120px] rounded-full" />
      </div>

      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ 
          scale: 1, 
          y: 0,
          x: status === "error" ? [0, -10, 10, -10, 10, 0] : 0 
        }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 25,
          x: { duration: 0.4 } 
        }}
        className={`relative w-full max-w-md bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center gap-6 transition-colors duration-300 ${
          status === "success" ? "border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.2)]" : 
          status === "error" ? "border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)]" : ""
        }`}
      >
        <div className="flex flex-col items-center gap-2">
          <div className={`p-4 rounded-full bg-white/5 border border-white/10 mb-2 transition-colors duration-300 ${
            status === "success" ? "text-green-500 border-green-500/30" : "text-cyan-400 border-cyan-500/30"
          }`}>
            <KeyRound className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-white">ACCESS REQUIRED</h1>
          <p className="text-sm text-center text-white/50 px-4 leading-relaxed">
            This website is locked sooo no broke bums pay up for the key lol
          </p>
        </div>

        <div className="w-full space-y-4">
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-cyan-400 transition-colors">
              <Terminal className="w-5 h-5" />
            </div>
            <Input
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="Enter Code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              onKeyDown={handleKeyDown}
              className={`w-full h-14 bg-white/5 border-white/10 pl-12 text-center text-2xl font-mono tracking-[0.5em] focus-visible:ring-0 focus-visible:ring-offset-0 transition-all duration-300 ${
                status === "success" ? "border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]" : 
                "focus:border-cyan-500 focus:shadow-[0_0_20px_rgba(6,182,212,0.3)]"
              }`}
            />
          </div>

          <Button
            onClick={handleUnlock}
            disabled={code.length !== 4 || isSubmitting}
            className={`w-full h-12 text-sm font-bold tracking-widest uppercase transition-all duration-300 relative overflow-hidden group ${
              status === "success" ? "bg-green-600 hover:bg-green-600" : "bg-cyan-600 hover:bg-cyan-500"
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span className="relative z-10">UNLOCK</span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <div className="absolute inset-0 shadow-[0_0_20px_rgba(6,182,212,0.5)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
