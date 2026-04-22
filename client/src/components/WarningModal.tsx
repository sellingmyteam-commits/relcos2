import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Shield } from "lucide-react";

type Warning = {
  id: number;
  message: string;
  fromAdmin: string;
  createdAt: string | null;
};

export function WarningModal() {
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [busy, setBusy] = useState(false);

  const fetchWarnings = async () => {
    const storedId = localStorage.getItem("siteUserId");
    if (!storedId) return;
    try {
      const res = await fetch(`/api/user/warnings/${storedId}`);
      if (!res.ok) return;
      setWarnings(await res.json());
    } catch {}
  };

  useEffect(() => {
    fetchWarnings();
    const id = setInterval(fetchWarnings, 6000);
    return () => clearInterval(id);
  }, []);

  const acknowledge = async () => {
    const top = warnings[0];
    const storedId = localStorage.getItem("siteUserId");
    if (!top || !storedId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/user/warnings/${top.id}/ack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: parseInt(storedId, 10) }),
      });
      if (res.ok) setWarnings(prev => prev.slice(1));
    } finally {
      setBusy(false);
    }
  };

  const top = warnings[0];

  return (
    <AnimatePresence>
      {top && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9500] bg-black/80 backdrop-blur-md"
            data-testid="warning-overlay"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: "spring", stiffness: 350, damping: 26 }}
            className="fixed inset-0 z-[9501] flex items-center justify-center pointer-events-none p-4"
          >
            <div className="pointer-events-auto w-full max-w-md relative" data-testid="warning-modal">
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{ boxShadow: "0 0 32px 6px rgba(245,158,11,0.45), 0 0 80px 18px rgba(245,158,11,0.18)" }}
              />
              <div className="relative bg-black/95 backdrop-blur-xl border-2 border-yellow-400/70 rounded-2xl overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />
                <div className="px-6 py-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2.5 bg-yellow-400/15 border border-yellow-400/40 rounded-xl shrink-0">
                      <AlertTriangle className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-yellow-400/70 font-mono uppercase tracking-[0.2em]">
                        Official Warning {warnings.length > 1 ? `· ${warnings.length} pending` : ""}
                      </p>
                      <p className="text-base font-display font-bold text-yellow-300 uppercase tracking-wider">
                        From The Admins
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-yellow-500/20 rounded-xl px-4 py-3 mb-4">
                    <p className="text-sm text-white/95 leading-relaxed whitespace-pre-wrap break-words" data-testid="text-warning-message">
                      {top.message}
                    </p>
                    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/10">
                      <Shield className="w-3 h-3 text-yellow-400/70" />
                      <span className="text-[10px] text-yellow-400/70 font-mono uppercase tracking-widest">
                        Issued by {top.fromAdmin}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={acknowledge}
                    disabled={busy}
                    data-testid="button-acknowledge-warning"
                    className="w-full py-3 bg-yellow-400/15 border border-yellow-400/50 rounded-xl text-yellow-300 text-sm font-bold uppercase tracking-wider hover:bg-yellow-400/25 transition-colors disabled:opacity-50"
                  >
                    I Understand
                  </button>
                </div>
                <div className="h-px w-full bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent" />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
