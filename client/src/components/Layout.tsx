import { Navigation } from "./Navigation";
import { motion } from "framer-motion";
import bgImage from "@assets/relcosback_1774405439610.jpg";

const PARTICLES = [
  { left: "8%",  bottom: "5%",  size: 3, duration: "14s", delay: "0s",   color: "rgba(0,255,249,0.6)" },
  { left: "22%", bottom: "10%", size: 2, duration: "18s", delay: "3s",   color: "rgba(255,0,193,0.6)" },
  { left: "40%", bottom: "3%",  size: 2, duration: "12s", delay: "6s",   color: "rgba(0,255,249,0.5)" },
  { left: "57%", bottom: "8%",  size: 3, duration: "20s", delay: "1.5s", color: "rgba(139,0,255,0.7)" },
  { left: "71%", bottom: "2%",  size: 2, duration: "16s", delay: "9s",   color: "rgba(255,0,193,0.5)" },
  { left: "85%", bottom: "6%",  size: 2, duration: "11s", delay: "4s",   color: "rgba(0,255,249,0.6)" },
  { left: "14%", bottom: "15%", size: 2, duration: "22s", delay: "7s",   color: "rgba(139,0,255,0.5)" },
  { left: "65%", bottom: "18%", size: 2, duration: "17s", delay: "2s",   color: "rgba(0,255,249,0.4)" },
  { left: "33%", bottom: "20%", size: 3, duration: "25s", delay: "11s",  color: "rgba(255,0,193,0.4)" },
  { left: "90%", bottom: "12%", size: 2, duration: "13s", delay: "5s",   color: "rgba(139,0,255,0.6)" },
];

export function Layout({ children, noContainer = false }: { children: React.ReactNode, noContainer?: boolean }) {
  return (
    <div className="min-h-screen bg-black flex flex-col font-body">

      {/* Background image — sits behind everything */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: -1,
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Dark overlay to keep contrast over the image */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: -1, background: "rgba(0,0,0,0.55)" }}
      />

      {/* Static grid */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-grid-glitch" />

      {/* Scanlines */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-scanlines opacity-40" />

      {/* Aurora bloom — cyan top-left */}
      <div className="fixed top-0 left-0 z-0 pointer-events-none" style={{ width:"60vw", height:"60vh", background:"radial-gradient(ellipse at top left, rgba(0,255,249,0.12), transparent 65%)", animation:"aurora-drift 12s ease-in-out infinite" }} />

      {/* Aurora bloom — pink bottom-right */}
      <div className="fixed bottom-0 right-0 z-0 pointer-events-none" style={{ width:"60vw", height:"60vh", background:"radial-gradient(ellipse at bottom right, rgba(255,0,193,0.10), transparent 65%)", animation:"aurora-drift 15s ease-in-out infinite 3s" }} />

      {/* Aurora bloom — purple center */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none" style={{ width:"50vw", height:"50vh", background:"radial-gradient(ellipse at center, rgba(139,0,255,0.06), transparent 70%)", animation:"aurora-drift 18s ease-in-out infinite 6s" }} />

      {/* Aurora bloom — teal top-right */}
      <div className="fixed top-0 right-0 z-0 pointer-events-none" style={{ width:"45vw", height:"45vh", background:"radial-gradient(ellipse at top right, rgba(0,200,255,0.08), transparent 65%)", animation:"aurora-drift 20s ease-in-out infinite 9s" }} />

      {/* Horizontal glitch bars */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ background:"linear-gradient(180deg, rgba(0,255,249,0.22) 0%, transparent 100%)", animation:"glitch-bar 10s steps(1) infinite" }} />
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ background:"linear-gradient(180deg, rgba(255,0,193,0.20) 0%, transparent 100%)", animation:"glitch-bar-2 13s steps(1) infinite 1.5s" }} />

      {/* VSync scan line — sweeps top to bottom */}
      <div className="fixed left-0 right-0 z-0 pointer-events-none" style={{ top:0, height:"2px", background:"linear-gradient(90deg, transparent, rgba(0,255,249,0.45) 20%, rgba(255,255,255,0.55) 50%, rgba(0,255,249,0.45) 80%, transparent)", boxShadow:"0 0 6px 2px rgba(0,255,249,0.3), 0 0 16px 3px rgba(0,255,249,0.12)", animation:"vt-scan 7s linear infinite" }} />

      {/* RGB chromatic split — red channel */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ background:"rgba(255,30,0,0.10)", mixBlendMode:"screen", animation:"chroma-r 11s steps(1) infinite" }} />

      {/* RGB chromatic split — blue channel */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ background:"rgba(0,60,255,0.10)", mixBlendMode:"screen", animation:"chroma-b 11s steps(1) infinite 0.5s" }} />

      {/* Block corruption — cyan patches */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ background:"rgba(0,255,249,0.22)", animation:"block-corrupt-a 9s steps(1) infinite" }} />

      {/* Block corruption — pink patches */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ background:"rgba(255,0,193,0.20)", animation:"block-corrupt-b 8s steps(1) infinite 1.2s" }} />

      {/* Digital noise burst */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")", backgroundSize:"200px 200px", animation:"noise-burst 18s steps(1) infinite" }} />

      {/* CRT flicker overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-white" style={{ animation:"crt-flicker 7s steps(1) infinite" }} />

      {/* Neon edge — top */}
      <div className="fixed top-0 left-0 right-0 z-0 pointer-events-none" style={{ height:"1px", background:"linear-gradient(90deg, transparent, rgba(0,255,249,0.8) 30%, rgba(255,0,193,0.8) 70%, transparent)", color:"rgba(0,255,249,0.6)", animation:"edge-glow-h 4s ease-in-out infinite" }} />

      {/* Neon edge — bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-0 pointer-events-none" style={{ height:"1px", background:"linear-gradient(90deg, transparent, rgba(255,0,193,0.8) 30%, rgba(0,255,249,0.8) 70%, transparent)", color:"rgba(255,0,193,0.6)", animation:"edge-glow-h 5s ease-in-out infinite 2s" }} />

      {/* Neon edge — left */}
      <div className="fixed top-0 left-0 bottom-0 z-0 pointer-events-none" style={{ width:"1px", background:"linear-gradient(180deg, transparent, rgba(139,0,255,0.8) 50%, transparent)", color:"rgba(139,0,255,0.6)", animation:"edge-glow-v 6s ease-in-out infinite 1s" }} />

      {/* Neon edge — right */}
      <div className="fixed top-0 right-0 bottom-0 z-0 pointer-events-none" style={{ width:"1px", background:"linear-gradient(180deg, transparent, rgba(0,255,249,0.8) 50%, transparent)", color:"rgba(0,255,249,0.6)", animation:"edge-glow-v 7s ease-in-out infinite 3s" }} />

      {/* Corner pulse — top-left */}
      <div className="fixed top-0 left-0 z-0 pointer-events-none w-72 h-72" style={{ background:"radial-gradient(circle at top left, rgba(0,255,249,0.09), transparent 70%)", animation:"corner-pulse 5s ease-in-out infinite" }} />

      {/* Corner pulse — bottom-right */}
      <div className="fixed bottom-0 right-0 z-0 pointer-events-none w-72 h-72" style={{ background:"radial-gradient(circle at bottom right, rgba(255,0,193,0.09), transparent 70%)", animation:"corner-pulse 6s ease-in-out infinite 1.5s" }} />

      {/* Floating particles */}
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className="fixed z-0 pointer-events-none rounded-full"
          style={{
            left: p.left,
            bottom: p.bottom,
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            animation: `particle-rise ${p.duration} ease-in-out infinite ${p.delay}`,
          }}
        />
      ))}

      {/* Vignette */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ background:"radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.65) 100%)", animation:"vignette-pulse 8s ease-in-out infinite" }} />

      <Navigation />

      <main className={`flex-1 relative z-10 ${noContainer ? "" : "container mx-auto px-4 py-8 pb-24 md:pb-12"}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="h-full"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
