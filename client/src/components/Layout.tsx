import { Navigation } from "./Navigation";
import { motion } from "framer-motion";
import cityBg from "@assets/relcos-vr_1784208600021.png";

const bgStyle = { left: "var(--sidebar-width, 224px)" } as React.CSSProperties;

export function Layout({ children, noContainer = false }: { children: React.ReactNode, noContainer?: boolean }) {
  return (
    <div className="min-h-screen flex font-body">

      {/* Background image — starts after sidebar */}
      <img
        src={cityBg}
        alt=""
        aria-hidden
        className="fixed top-0 bottom-0 right-0 object-cover z-0 pointer-events-none select-none"
        style={{ ...bgStyle, width: "calc(100% - var(--sidebar-width, 224px))", height: "100%", objectPosition: "center center" }}
      />

      {/* Dark overlay */}
      <div className="fixed top-0 bottom-0 right-0 z-0 pointer-events-none bg-black/55" style={bgStyle} />

      {/* Grid */}
      <div className="fixed top-0 bottom-0 right-0 z-0 pointer-events-none bg-grid-glitch opacity-30" style={bgStyle} />

      {/* Scanlines */}
      <div className="fixed top-0 bottom-0 right-0 z-0 pointer-events-none bg-scanlines opacity-20" style={bgStyle} />

      {/* Aurora bloom — cyan top-left of content area */}
      <div className="fixed top-0 bottom-0 right-0 z-0 pointer-events-none" style={{ ...bgStyle, background:"radial-gradient(ellipse at top left, rgba(0,255,249,0.08), transparent 65%)", animation:"aurora-drift 14s ease-in-out infinite" }} />

      {/* Aurora bloom — pink bottom-right */}
      <div className="fixed bottom-0 right-0 z-0 pointer-events-none" style={{ width:"55vw", height:"55vh", background:"radial-gradient(ellipse at bottom right, rgba(255,0,193,0.06), transparent 65%)", animation:"aurora-drift 18s ease-in-out infinite 4s" }} />

      {/* Neon edge — top */}
      <div className="fixed top-0 right-0 z-0 pointer-events-none" style={{ ...bgStyle, height:"1px", background:"linear-gradient(90deg, transparent, rgba(0,255,249,0.7) 30%, rgba(255,0,193,0.7) 70%, transparent)", animation:"edge-glow-h 5s ease-in-out infinite" }} />

      {/* Neon edge — bottom */}
      <div className="fixed bottom-0 right-0 z-0 pointer-events-none" style={{ ...bgStyle, height:"1px", background:"linear-gradient(90deg, transparent, rgba(255,0,193,0.7) 30%, rgba(0,255,249,0.7) 70%, transparent)", animation:"edge-glow-h 6s ease-in-out infinite 2s" }} />

      {/* Vignette */}
      <div className="fixed top-0 bottom-0 right-0 z-0 pointer-events-none" style={{ ...bgStyle, background:"radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.65) 100%)" }} />

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
