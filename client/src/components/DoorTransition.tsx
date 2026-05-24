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
    const t = setTimeout(() => setState(null), 900);
    return () => {
      cancelAnimationFrame(r);
      clearTimeout(t);
    };
  }, [state]);

  return (
    <DoorContext.Provider value={{ open }}>
      {children}
      {state && <GlitchOverlay key={state.id} label={state.label} />}
    </DoorContext.Provider>
  );
}

const GLITCH_CHARS = "!<>-_\\/[]{}—=+*^?#@$%&|~";

function randomChar() {
  return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
}

function glitchText(text: string, intensity: number): string {
  return text
    .split("")
    .map((c) =>
      Math.random() < intensity ? randomChar() : c
    )
    .join("");
}

function GlitchOverlay({ label }: { label: string }) {
  const [bars, setBars] = useState<{ top: number; height: number; offset: number; opacity: number; color: string }[]>([]);
  const [chroma, setChroma] = useState({ x: 0, y: 0 });
  const [displayLabel, setDisplayLabel] = useState(label);
  const [flicker, setFlicker] = useState(false);
  const [whiteFlash, setWhiteFlash] = useState(false);
  const [progress, setProgress] = useState(0);
  const startTime = useRef(Date.now());
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const DURATION = 900;

    const tick = () => {
      const elapsed = Date.now() - startTime.current;
      const p = Math.min(elapsed / DURATION, 1);
      setProgress(p);

      const intensity = p < 0.6
        ? 0.4 + Math.sin(p * Math.PI * 8) * 0.4
        : 1 - (p - 0.6) / 0.4;

      const barCount = Math.floor(intensity * 12);
      setBars(
        Array.from({ length: barCount }, () => ({
          top: Math.random() * 100,
          height: Math.random() * 8 + 1,
          offset: (Math.random() - 0.5) * 120,
          opacity: Math.random() * 0.8 + 0.2,
          color: Math.random() < 0.5
            ? `rgba(0,255,249,${Math.random() * 0.6 + 0.2})`
            : `rgba(255,0,60,${Math.random() * 0.6 + 0.2})`,
        }))
      );

      setChroma({
        x: (Math.random() - 0.5) * 20 * intensity,
        y: (Math.random() - 0.5) * 6 * intensity,
      });

      const glitchIntensity = p < 0.5 ? p * 0.8 : (1 - p) * 1.6;
      setDisplayLabel(glitchText(label, glitchIntensity));

      setFlicker(Math.random() < 0.15 * intensity);
      setWhiteFlash(p < 0.05 || (p > 0.45 && p < 0.55 && Math.random() < 0.5));

      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [label]);

  const opacity = progress < 0.1
    ? progress / 0.1
    : progress > 0.75
    ? 1 - (progress - 0.75) / 0.25
    : 1;

  return (
    <div
      className="fixed inset-0 z-[10000] pointer-events-none overflow-hidden"
      style={{ opacity }}
      data-testid="door-transition"
    >
      {/* Dark base */}
      <div className="absolute inset-0 bg-[#060610]" />

      {/* Scanlines */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, rgba(0,255,249,0.03) 0 1px, transparent 1px 3px)",
          pointerEvents: "none",
        }}
      />

      {/* Glitch bars */}
      {bars.map((b, i) => (
        <div
          key={i}
          className="absolute w-full"
          style={{
            top: `${b.top}%`,
            height: `${b.height}px`,
            background: b.color,
            transform: `translateX(${b.offset}px)`,
            mixBlendMode: "screen",
          }}
        />
      ))}

      {/* RGB channel cyan */}
      <div
        className="absolute inset-0"
        style={{
          background: `rgba(0,255,249,0.06)`,
          transform: `translate(${chroma.x * 1.5}px, ${chroma.y}px)`,
          mixBlendMode: "screen",
        }}
      />

      {/* RGB channel red */}
      <div
        className="absolute inset-0"
        style={{
          background: `rgba(255,0,60,0.06)`,
          transform: `translate(${-chroma.x}px, ${chroma.y * 0.5}px)`,
          mixBlendMode: "screen",
        }}
      />

      {/* White strobe flash */}
      {whiteFlash && (
        <div className="absolute inset-0 bg-white/20" />
      )}

      {/* Flicker dim */}
      {flicker && (
        <div className="absolute inset-0 bg-black/40" />
      )}

      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <div
          className="text-[9px] font-mono tracking-[0.6em] uppercase"
          style={{ color: "rgba(0,255,249,0.6)" }}
        >
          LOADING GAME
        </div>

        <div className="relative">
          {/* Cyan ghost */}
          <div
            className="absolute inset-0 flex items-center justify-center text-2xl sm:text-3xl font-black font-display tracking-wider uppercase"
            style={{
              color: "rgba(0,255,249,0.4)",
              transform: `translate(${chroma.x * 0.6}px, 0)`,
              filter: "blur(1px)",
            }}
          >
            {displayLabel}
          </div>
          {/* Red ghost */}
          <div
            className="absolute inset-0 flex items-center justify-center text-2xl sm:text-3xl font-black font-display tracking-wider uppercase"
            style={{
              color: "rgba(255,0,60,0.35)",
              transform: `translate(${-chroma.x * 0.4}px, 0)`,
              filter: "blur(1px)",
            }}
          >
            {displayLabel}
          </div>
          {/* Main label */}
          <div
            className="relative text-2xl sm:text-3xl font-black font-display tracking-wider uppercase"
            style={{
              color: "#e0f7ff",
              textShadow: `0 0 20px rgba(0,255,249,0.8), 0 0 60px rgba(0,255,249,0.4), ${chroma.x * 0.3}px 0 0 rgba(255,0,60,0.6), ${-chroma.x * 0.3}px 0 0 rgba(0,255,249,0.6)`,
            }}
          >
            {displayLabel}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-40 h-px bg-white/10 mt-3 overflow-hidden">
          <div
            className="h-full transition-none"
            style={{
              width: `${progress * 100}%`,
              background: "linear-gradient(90deg, rgba(0,255,249,0.8), rgba(255,0,200,0.8))",
              boxShadow: "0 0 8px rgba(0,255,249,0.8)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
