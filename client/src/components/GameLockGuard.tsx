import { useEffect } from "react";
import { useLocation } from "wouter";
import { useGameLocks } from "@/hooks/useGameLocks";
import { Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ALL_GAMES } from "@/lib/games";

export function GameLockGuard() {
  const [location, setLocation] = useLocation();
  const { isLocked } = useGameLocks();

  const onGamePage = ALL_GAMES.some(g => g.href === location);
  const blocked = onGamePage && isLocked(location);
  const game = ALL_GAMES.find(g => g.href === location);

  useEffect(() => {
    if (!blocked) return;
    const t = setTimeout(() => setLocation("/"), 3500);
    return () => clearTimeout(t);
  }, [blocked, setLocation]);

  return (
    <AnimatePresence>
      {blocked && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9700] flex items-center justify-center bg-black/95 p-4"
          data-testid="overlay-game-locked"
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 3px)",
              animation: "tv-static 0.12s steps(2) infinite",
              opacity: 0.65,
            }}
          />
          <div className="relative max-w-md text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-500/15 border-2 border-red-500/50 mb-5">
              <Lock className="w-10 h-10 text-red-400" />
            </div>
            <p className="text-[10px] font-mono text-red-400/70 uppercase tracking-[0.3em] mb-2">
              Access Denied
            </p>
            <h2 className="text-2xl font-display font-bold text-white uppercase tracking-wider mb-2">
              {game?.label ?? "Game"} Locked by Admin
            </h2>
            <p className="text-sm text-white/60 mb-5">
              This game has been disabled. Returning to home...
            </p>
            <button
              onClick={() => setLocation("/")}
              className="px-5 py-2.5 bg-red-500/15 border border-red-500/50 rounded-lg text-red-300 text-xs font-bold uppercase tracking-wider hover:bg-red-500/25 transition-colors"
              data-testid="button-locked-back"
            >
              Back to Hub
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
