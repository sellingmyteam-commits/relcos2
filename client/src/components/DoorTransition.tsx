import { motion, AnimatePresence } from "framer-motion";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

type DoorState = { id: number; label: string };

type DoorContextValue = {
  open: (label: string, onReveal?: () => void) => void;
};

const DoorContext = createContext<DoorContextValue>({ open: () => {} });

export function useDoor() {
  return useContext(DoorContext);
}

export function DoorProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DoorState | null>(null);
  const onRevealRef = useRef<(() => void) | undefined>(undefined);

  const open = useCallback((label: string, onReveal?: () => void) => {
    onRevealRef.current = onReveal;
    setState({ id: Date.now(), label });
  }, []);

  useEffect(() => {
    if (!state) return;
    const reveal = onRevealRef.current;
    onRevealRef.current = undefined;
    const r = requestAnimationFrame(() => {
      reveal?.();
    });
    const t = setTimeout(() => setState(null), 1400);
    return () => {
      cancelAnimationFrame(r);
      clearTimeout(t);
    };
  }, [state]);

  return (
    <DoorContext.Provider value={{ open }}>
      {children}
      <DoorOverlay state={state} />
    </DoorContext.Provider>
  );
}

function DoorOverlay({ state }: { state: DoorState | null }) {
  return (
    <AnimatePresence>
      {state && (
        <motion.div
          key={state.id}
          className="fixed inset-0 z-[10000] pointer-events-none overflow-hidden"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          data-testid="door-transition"
        >
          <motion.div
            className="absolute top-0 left-0 h-full w-1/2 border-r border-secondary/40 shadow-[0_0_60px_rgba(0,0,0,0.7)]"
            style={{
              backgroundImage:
                "linear-gradient(135deg, #0b0b14 0%, #18182a 50%, #0b0b14 100%)",
            }}
            initial={{ x: 0 }}
            animate={{ x: "-100%" }}
            transition={{ duration: 1.0, ease: [0.7, 0, 0.2, 1], delay: 0.2 }}
          >
            <div
              className="absolute inset-0 opacity-40 mix-blend-overlay"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 4px)",
              }}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-2">
              <div className="w-3 h-10 rounded-full bg-secondary/60 shadow-[0_0_15px_rgba(56,189,248,0.6)]" />
              <div className="w-3 h-3 rounded-full bg-pink-500/80 shadow-[0_0_12px_rgba(236,72,153,0.7)] animate-pulse" />
            </div>
            <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-secondary/60 to-transparent" />
          </motion.div>

          <motion.div
            className="absolute top-0 right-0 h-full w-1/2 border-l border-secondary/40 shadow-[0_0_60px_rgba(0,0,0,0.7)]"
            style={{
              backgroundImage:
                "linear-gradient(225deg, #0b0b14 0%, #18182a 50%, #0b0b14 100%)",
            }}
            initial={{ x: 0 }}
            animate={{ x: "100%" }}
            transition={{ duration: 1.0, ease: [0.7, 0, 0.2, 1], delay: 0.2 }}
          >
            <div
              className="absolute inset-0 opacity-40 mix-blend-overlay"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 4px)",
              }}
            />
            <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-2">
              <div className="w-3 h-10 rounded-full bg-secondary/60 shadow-[0_0_15px_rgba(56,189,248,0.6)]" />
              <div className="w-3 h-3 rounded-full bg-pink-500/80 shadow-[0_0_12px_rgba(236,72,153,0.7)] animate-pulse" />
            </div>
            <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-secondary/60 to-transparent" />
          </motion.div>

          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.7, 1, 1, 1.4] }}
            transition={{ duration: 1.1, times: [0, 0.18, 0.65, 1], ease: "easeOut" }}
          >
            <div className="text-center">
              <div className="text-[10px] font-mono tracking-[0.4em] text-secondary/70 mb-1">
                ACCESS GRANTED
              </div>
              <div className="text-3xl font-display font-black tracking-tight text-white drop-shadow-[0_0_20px_rgba(56,189,248,0.7)]">
                {state.label || "ENTERING"}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
