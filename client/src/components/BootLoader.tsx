import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const STATES = [
  { label: "Contacting RELC.OS servers", delay: 600, duration: 1400 },
  { label: "Establishing encrypted tunnel", delay: 2200, duration: 1200 },
  { label: "Bypassing network restrictions", delay: 3600, duration: 1600 },
  { label: "Authenticating gateway access", delay: 5400, duration: 1100 },
  { label: "Syncing user database", delay: 6700, duration: 900 },
  { label: "Loading game catalog", delay: 7800, duration: 800 },
  { label: "Initializing chat systems", delay: 8800, duration: 700 },
  { label: "Finalizing connection", delay: 9700, duration: 900 },
];

const FADE_START = 11200;

type LineState = "pending" | "loading" | "done";

export function BootLoader({ onComplete }: { onComplete: () => void }) {
  const [lineStates, setLineStates] = useState<LineState[]>(
    STATES.map(() => "pending")
  );
  const [progress, setProgress] = useState(0);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    STATES.forEach((s, i) => {
      timers.push(
        setTimeout(() => {
          setLineStates((prev) => {
            const next = [...prev];
            next[i] = "loading";
            return next;
          });
        }, s.delay)
      );
      timers.push(
        setTimeout(() => {
          setLineStates((prev) => {
            const next = [...prev];
            next[i] = "done";
            return next;
          });
        }, s.delay + s.duration)
      );
    });

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setProgress(Math.min((elapsed / FADE_START) * 100, 100));
    }, 40);

    timers.push(setTimeout(() => setOpacity(0), FADE_START));
    timers.push(setTimeout(() => onComplete(), FADE_START + 900));

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(interval);
    };
  }, []);

  const activeIndex = lineStates.lastIndexOf("loading");
  const doneCount = lineStates.filter((s) => s === "done").length;

  return (
    <div
      className="fixed inset-0 z-[500] flex flex-col items-center justify-center"
      style={{
        background: "hsl(240, 25%, 6%)",
        opacity,
        transition: "opacity 0.9s ease-in-out",
        pointerEvents: opacity < 0.5 ? "none" : "all",
      }}
    >
      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)",
        }}
      />

      {/* Background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse, hsl(var(--secondary) / 0.08) 0%, transparent 65%)",
          filter: "blur(60px)",
        }}
      />

      <div className="relative w-full max-w-md px-8 flex flex-col items-center gap-10">

        {/* Logo + header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="text-center flex flex-col items-center gap-3"
        >
          <div
            className="text-4xl font-display font-black tracking-[0.2em] uppercase"
            style={{
              color: "hsl(var(--secondary))",
              textShadow:
                "0 0 30px hsl(var(--secondary) / 0.5), 0 0 70px hsl(var(--secondary) / 0.2)",
            }}
          >
            RELC.OS
          </div>

          {/* Pulsing "contacting" header */}
          <div className="flex flex-col items-center gap-1">
            <p
              className="text-base font-mono font-bold tracking-wider"
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              Contacting RELC.OS servers
              <DotSpinner />
            </p>
            <p
              className="text-[10px] font-mono tracking-[0.25em] uppercase"
              style={{ color: "rgba(255,255,255,0.2)" }}
            >
              private network gateway
            </p>
          </div>
        </motion.div>

        {/* Status list */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="w-full flex flex-col gap-2.5"
        >
          {STATES.map((s, i) => {
            const state = lineStates[i];
            const visible = state !== "pending";
            return (
              <div
                key={i}
                className="flex items-center gap-3 transition-all duration-300"
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateX(0)" : "translateX(-8px)",
                }}
              >
                {/* Icon */}
                <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                  {state === "loading" && <Spinner />}
                  {state === "done" && <Check />}
                  {state === "pending" && null}
                </div>

                {/* Label */}
                <span
                  className="text-sm font-mono"
                  style={{
                    color:
                      state === "done"
                        ? "rgba(255,255,255,0.9)"
                        : state === "loading"
                        ? "rgba(255,255,255,0.65)"
                        : "rgba(255,255,255,0.3)",
                  }}
                >
                  {s.label}
                  {state === "loading" && (
                    <span
                      className="ml-1 text-xs"
                      style={{ color: "hsl(var(--secondary))" }}
                    >
                      ...
                    </span>
                  )}
                </span>

                {/* Done tick badge */}
                {state === "done" && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="ml-auto text-[9px] font-mono font-bold tracking-widest uppercase px-1.5 py-0.5 rounded"
                    style={{
                      color: "rgb(74,222,128)",
                      background: "rgba(74,222,128,0.1)",
                      border: "1px solid rgba(74,222,128,0.2)",
                    }}
                  >
                    OK
                  </motion.span>
                )}
              </div>
            );
          })}
        </motion.div>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="w-full space-y-2"
        >
          <div
            className="flex items-center justify-between text-[9px] font-mono tracking-[0.2em] uppercase"
            style={{ color: "rgba(255,255,255,0.22)" }}
          >
            <span>{doneCount} / {STATES.length} tasks complete</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div
            className="h-px w-full rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.07)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background:
                  "linear-gradient(90deg, hsl(var(--secondary)), hsl(var(--accent)))",
                boxShadow: "0 0 10px hsl(var(--secondary) / 0.5)",
                transition: "width 80ms linear",
              }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function DotSpinner() {
  const [dots, setDots] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDots((d) => (d + 1) % 4), 420);
    return () => clearInterval(t);
  }, []);
  return (
    <span style={{ color: "hsl(var(--secondary))", letterSpacing: "0.05em" }}>
      {".".repeat(dots)}
      <span style={{ opacity: 0 }}>{".".repeat(3 - dots)}</span>
    </span>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
    >
      <circle
        cx="8"
        cy="8"
        r="6"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="2"
      />
      <path
        d="M8 2 A6 6 0 0 1 14 8"
        stroke="hsl(var(--secondary))"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Check() {
  return (
    <motion.svg
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 22 }}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
    >
      <circle cx="8" cy="8" r="7" fill="rgba(74,222,128,0.15)" />
      <path
        d="M5 8.5L7 10.5L11 6"
        stroke="rgb(74,222,128)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </motion.svg>
  );
}
