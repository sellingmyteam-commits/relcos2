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
  const [frame, setFrame] = useState(0);
  const [displayLabel, setDisplayLabel] = useState(label);
  const [slices, setSlices] = useState<{ top: number; h: number; shift: number; color: string }[]>([]);
  const startRef = useRef(Date.now());
  const rafRef = useRef(0);

  useEffect(() => {
    const DURATION = 800;

    const tick = () => {
      const p = Math.min((Date.now() - startRef.current) / DURATION, 1);
      setFrame(f => f + 1);

      const peak = Math.sin(p * Math.PI);

      const scrambleAmt = peak * 0.5;
      setDisplayLabel(scramble(label, scrambleAmt));

      if (Math.random() < peak * 0.7) {
        const count = Math.floor(peak * 3) + 1;
        setSlices(Array.from({ length: count }, () => {
          const colors = ["#ff00aa", "#00ffee", "#9b5de5"];
          return {
            top: Math.random() * 100,
            h: Math.random() * 4 + 1,
            shift: (Math.random() - 0.5) * 40 * peak,
            color: colors[Math.floor(Math.random() * colors.length)],
          };
        }));
      } else {
        setSlices([]);
      }

      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [label]);

  const p = Math.min((Date.now() - startRef.current) / 800, 1);
  const opacity = p < 0.12 ? p / 0.12 : p > 0.78 ? 1 - (p - 0.78) / 0.22 : 1;
  const chromaX = Math.sin(frame * 0.8) * 6 * Math.sin(p * Math.PI);

  return (
    <div
      className="fixed inset-0 z-[10000] pointer-events-none overflow-hidden flex items-center justify-center"
      style={{ opacity, background: "rgba(6,4,18,0.97)" }}
      data-testid="door-transition"
    >
      {/* Thin scanlines */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.015) 0 1px, transparent 1px 4px)",
        }}
      />

      {/* Glitch slices */}
      {slices.map((s, i) => (
        <div
          key={i}
          className="absolute w-full"
          style={{
            top: `${s.top}%`,
            height: `${s.h}px`,
            background: s.color,
            opacity: 0.5,
            transform: `translateX(${s.shift}px)`,
            mixBlendMode: "screen",
          }}
        />
      ))}

      {/* Label */}
      <div className="relative flex flex-col items-center gap-4">
        <div className="relative select-none">
          {/* Cyan ghost left */}
          <span
            className="absolute inset-0 flex items-center justify-center text-2xl font-black font-display tracking-widest uppercase"
            style={{
              color: "#00ffee",
              opacity: 0.45,
              transform: `translateX(${-chromaX}px)`,
              filter: "blur(1.5px)",
            }}
          >
            {displayLabel}
          </span>
          {/* Pink ghost right */}
          <span
            className="absolute inset-0 flex items-center justify-center text-2xl font-black font-display tracking-widest uppercase"
            style={{
              color: "#ff00aa",
              opacity: 0.4,
              transform: `translateX(${chromaX}px)`,
              filter: "blur(1.5px)",
            }}
          >
            {displayLabel}
          </span>
          {/* Main white label */}
          <span
            className="relative text-2xl font-black font-display tracking-widest uppercase"
            style={{
              color: "#fff",
              textShadow: `0 0 24px #9b5de5, 0 0 48px #9b5de560`,
            }}
          >
            {displayLabel}
          </span>
        </div>

        {/* Thin progress bar */}
        <div className="w-32 h-[2px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div
            className="h-full rounded-full transition-none"
            style={{
              width: `${Math.min((Date.now() - startRef.current) / 800, 1) * 100}%`,
              background: "linear-gradient(90deg, #00ffee, #ff00aa, #9b5de5)",
              boxShadow: "0 0 6px #ff00aa",
            }}
          />
        </div>
      </div>
    </div>
  );
}
