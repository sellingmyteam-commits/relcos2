import { useRef, useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { SidebarChat } from "@/components/SidebarChat";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface GamePageProps {
  src: string;
  title: string;
  gameId?: string;
  banner?: React.ReactNode;
}

export function GamePage({ src, title, banner }: GamePageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const handleToggleFullscreen = () => {
      if (containerRef.current) {
        if (!document.fullscreenElement) {
          containerRef.current.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen();
        }
      }
    };
    window.addEventListener("toggle-fullscreen", handleToggleFullscreen);
    return () => window.removeEventListener("toggle-fullscreen", handleToggleFullscreen);
  }, []);

  useEffect(() => {
    const totalMs = 4000 + Math.random() * 6000;
    const intervalMs = 80;
    const steps = totalMs / intervalMs;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const raw = step / steps;
      const eased = raw < 0.5
        ? 2 * raw * raw
        : 1 - Math.pow(-2 * raw + 2, 2) / 2;
      setProgress(Math.min(eased * 100, 99));

      if (step >= steps) {
        clearInterval(timer);
        setProgress(100);
        setDone(true);
        setTimeout(() => setVisible(false), 600);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, []);

  return (
    <Layout noContainer>
      {banner && (
        <div className="shrink-0">{banner}</div>
      )}
      <div className={cn("flex overflow-hidden", banner ? "h-[calc(100vh-8rem)]" : "h-[calc(100vh-5rem)]")}>
        <div ref={containerRef} className="flex-1 relative bg-black overflow-hidden">
          <iframe
            src={src}
            className="w-full h-full border-0"
            allow="autoplay; fullscreen; keyboard"
            title={title}
            onMouseEnter={(e) => e.currentTarget.focus()}
          />

          {visible && (
            <div
              className={cn(
                "absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 transition-opacity duration-500",
                done ? "opacity-0 pointer-events-none" : "opacity-100",
                "bg-[#080810]"
              )}
            >
              <div className="flex flex-col items-center gap-5 w-full max-w-xs px-6">
                <Loader2 className="w-10 h-10 text-secondary animate-spin" />

                <div className="text-center space-y-1">
                  <p className="text-white font-display font-black text-lg uppercase tracking-widest">
                    {title}
                  </p>
                  <p className="text-muted-foreground text-xs font-mono uppercase tracking-widest">
                    Loading...
                  </p>
                </div>

                <div className="w-full">
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary rounded-full transition-all duration-100 ease-linear shadow-[0_0_8px_theme(colors.secondary.DEFAULT)]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[9px] text-muted-foreground/50 font-mono">INITIALIZING</span>
                    <span className="text-[9px] text-secondary/80 font-mono">{Math.floor(progress)}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <SidebarChat />
      </div>
    </Layout>
  );
}
