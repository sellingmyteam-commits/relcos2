import { Navigation } from "./Navigation";
import { motion } from "framer-motion";

export function Layout({ children, noContainer = false }: { children: React.ReactNode, noContainer?: boolean }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-background to-black flex font-body">

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
