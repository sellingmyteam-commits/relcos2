import { Navigation } from "./Navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type GlitchSeed = {
  gridDur: number;
  gridDelay: number;
  stripADur: number;
  stripADelay: number;
  stripBDur: number;
  stripBDelay: number;
  bar1Dur: number;
  bar1Delay: number;
  bar2Dur: number;
  bar2Delay: number;
  flickDur: number;
  flickDelay: number;
  burstX: number;
  burstY: number;
  burstOpacity: number;
};

function makeSeed(): GlitchSeed {
  const r = (min: number, max: number) => min + Math.random() * (max - min);
  return {
    gridDur: r(2.2, 5.5),
    gridDelay: r(0, 2),
    stripADur: r(1.6, 4.5),
    stripADelay: r(0, 3),
    stripBDur: r(1.8, 5),
    stripBDelay: r(0, 3.5),
    bar1Dur: r(2.5, 6),
    bar1Delay: r(0, 4),
    bar2Dur: r(3, 7),
    bar2Delay: r(0, 5),
    flickDur: r(4, 9),
    flickDelay: r(0, 4),
    burstX: r(-12, 12),
    burstY: r(-8, 8),
    burstOpacity: r(0.04, 0.18),
  };
}

export function Layout({ children, noContainer = false }: { children: React.ReactNode, noContainer?: boolean }) {
  const [seed, setSeed] = useState<GlitchSeed>(() => makeSeed());

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const reseed = () => {
      setSeed(makeSeed());
      timeoutId = setTimeout(reseed, 1500 + Math.random() * 4500);
    };
    timeoutId = setTimeout(reseed, 2000 + Math.random() * 3000);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-background to-black flex font-body">

      {/* Animated grid glitch overlay */}
      <div
        className="fixed inset-0 z-0 pointer-events-none bg-grid-glitch"
        style={{
          animation: `grid-glitch ${seed.gridDur}s steps(1) infinite`,
          animationDelay: `${seed.gridDelay}s`,
          transformOrigin: "center",
          transform: `translate(${seed.burstX * 0.2}px, ${seed.burstY * 0.2}px)`,
        }}
      />

      {/* Glitch bars (red & cyan offset slices) */}
      <div
        className="fixed inset-0 z-0 pointer-events-none bg-grid-glitch"
        style={{
          animation: `strip-shift-a ${seed.stripADur}s steps(1) infinite`,
          animationDelay: `${seed.stripADelay}s`,
          mixBlendMode: "screen",
        }}
      />
      <div
        className="fixed inset-0 z-0 pointer-events-none bg-grid-glitch"
        style={{
          animation: `strip-shift-b ${seed.stripBDur}s steps(1) infinite`,
          animationDelay: `${seed.stripBDelay}s`,
          mixBlendMode: "screen",
        }}
      />

      {/* Horizontal glitch tear bars */}
      <div
        className="fixed inset-0 z-0 pointer-events-none bg-secondary/20"
        style={{
          animation: `glitch-bar ${seed.bar1Dur}s steps(1) infinite`,
          animationDelay: `${seed.bar1Delay}s`,
        }}
      />
      <div
        className="fixed inset-0 z-0 pointer-events-none bg-accent/15"
        style={{
          animation: `glitch-bar-2 ${seed.bar2Dur}s steps(1) infinite`,
          animationDelay: `${seed.bar2Delay}s`,
        }}
      />

      {/* CRT flicker */}
      <div
        className="fixed inset-0 z-0 pointer-events-none bg-white"
        style={{
          animation: `crt-flicker ${seed.flickDur}s steps(1) infinite`,
          animationDelay: `${seed.flickDelay}s`,
          opacity: seed.burstOpacity,
        }}
      />

      {/* Random noise burst — re-renders every reseed */}
      <div
        key={`burst-${seed.gridDelay}`}
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: `repeating-linear-gradient(${Math.floor(seed.burstX * 10) % 180}deg, transparent 0 ${2 + Math.abs(seed.burstY)}px, rgba(0,255,249,0.03) ${2 + Math.abs(seed.burstY)}px ${4 + Math.abs(seed.burstY)}px)`,
          opacity: 0.5,
          mixBlendMode: "screen",
        }}
      />

      {/* Scanlines */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-scanlines opacity-30" />

      {/* Aurora bloom — cyan top-left */}
      <div className="fixed top-0 left-0 z-0 pointer-events-none" style={{ width:"55vw", height:"55vh", background:"radial-gradient(ellipse at top left, rgba(0,255,249,0.10), transparent 65%)", animation:"aurora-drift 14s ease-in-out infinite" }} />

      {/* Aurora bloom — pink bottom-right */}
      <div className="fixed bottom-0 right-0 z-0 pointer-events-none" style={{ width:"55vw", height:"55vh", background:"radial-gradient(ellipse at bottom right, rgba(255,0,193,0.08), transparent 65%)", animation:"aurora-drift 18s ease-in-out infinite 4s" }} />

      {/* Neon edge — top */}
      <div className="fixed top-0 left-0 right-0 z-0 pointer-events-none" style={{ height:"1px", background:"linear-gradient(90deg, transparent, rgba(0,255,249,0.7) 30%, rgba(255,0,193,0.7) 70%, transparent)", animation:"edge-glow-h 5s ease-in-out infinite" }} />

      {/* Neon edge — bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-0 pointer-events-none" style={{ height:"1px", background:"linear-gradient(90deg, transparent, rgba(255,0,193,0.7) 30%, rgba(0,255,249,0.7) 70%, transparent)", animation:"edge-glow-h 6s ease-in-out infinite 2s" }} />

      {/* Vignette */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ background:"radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.6) 100%)" }} />

      <Navigation />

      {noContainer ? (
        <main
          className="fixed top-0 bottom-0 right-0 z-10 overflow-hidden transition-[left] duration-300 ease-in-out"
          style={{ left: "var(--sidebar-width, 224px)" }}
        >
          {children}
        </main>
      ) : (
        <main className="relative z-10 sidebar-offset transition-[margin] duration-300 ease-in-out min-h-screen">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="px-6 py-6 pb-12"
          >
            {children}
          </motion.div>
        </main>
      )}
    </div>
  );
}
