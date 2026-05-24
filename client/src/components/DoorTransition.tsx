import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

type DoorState = { id: number; label: string };
type DoorContextValue = { open: (label: string, onReveal?: () => void) => void };

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
    requestAnimationFrame(() => reveal?.());
    const t = setTimeout(() => setState(null), 800);
    return () => clearTimeout(t);
  }, [state]);

  return (
    <DoorContext.Provider value={{ open }}>
      {children}
      {state && <GlitchOverlay key={state.id} label={state.label} />}
    </DoorContext.Provider>
  );
}

const CHARS = "!<>-_\\/[]{}=+*#$%";
function scramble(text: string, amount: number) {
  return text.split("").map((c) =>
    c !== " " && Math.random() < amount
      ? CHARS[Math.floor(Math.random() * CHARS.length)]
      : c
  ).join("");
}

function GlitchOverlay({ label }: { label: string }) {
  const [tick, setTick] = useState(0);
  const [displayLabel, setDisplayLabel] = useState(label);
  const startRef = useRef(Date.now());
  const rafRef = useRef(0);

  useEffect(() => {
    const DURATION = 800;
    const loop = () => {
      const p = Math.min((Date.now() - startRef.current) / DURATION, 1);
      const peak = Math.sin(p * Math.PI);
      setTick(n => n + 1);
      setDisplayLabel(scramble(label, peak * 0.45));
      if (p < 1) rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [label]);

  const p = Math.min((Date.now() - startRef.current) / 800, 1);
  const peak = Math.sin(p * Math.PI);
  const chromaX = Math.sin(tick * 0.6) * 8 * peak;
  const opacity = p < 0.12 ? p / 0.12 : p > 0.78 ? 1 - (p - 0.78) / 0.22 : 1;

  return (
    <div
      className="fixed inset-0 z-[10000] pointer-events-none flex items-center justify-center"
      style={{ opacity, background: "rgba(6,4,18,0.97)" }}
      data-testid="door-transition"
    >
      <div className="flex flex-col items-center gap-5">
        <div className="relative select-none">
          <span
            className="absolute inset-0 flex items-center justify-center text-2xl font-black font-display tracking-widest uppercase"
            style={{ color: "#00ffee", opacity: 0.5, transform: `translateX(${-chromaX}px)`, filter: "blur(2px)" }}
          >
            {displayLabel}
          </span>
          <span
            className="absolute inset-0 flex items-center justify-center text-2xl font-black font-display tracking-widest uppercase"
            style={{ color: "#ff00aa", opacity: 0.45, transform: `translateX(${chromaX}px)`, filter: "blur(2px)" }}
          >
            {displayLabel}
          </span>
          <span
            className="relative text-2xl font-black font-display tracking-widest uppercase"
            style={{ color: "#fff", textShadow: "0 0 30px #9b5de5, 0 0 60px #9b5de540" }}
          >
            {displayLabel}
          </span>
        </div>

        <div className="w-48 h-[4px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${p * 100}%`,
              background: "linear-gradient(90deg, #00ffee, #ff00aa, #9b5de5)",
              boxShadow: "0 0 8px #ff00aa80",
              transition: "none",
            }}
          />
        </div>
      </div>
    </div>
  );
}
