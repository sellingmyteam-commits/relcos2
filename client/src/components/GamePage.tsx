import { useRef, useEffect } from "react";
import { Layout } from "@/components/Layout";

interface GamePageProps {
  src: string;
  title: string;
  gameId?: string;
  banner?: React.ReactNode;
}

export function GamePage({ src, title, banner }: GamePageProps) {
  const containerRef = useRef<HTMLDivElement>(null);

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

  return (
    <Layout noContainer>
      <div className="flex flex-col h-full w-full">
        {banner && <div className="shrink-0">{banner}</div>}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <div ref={containerRef} className="flex-1 relative bg-black overflow-hidden">
            <iframe
              src={src}
              className="absolute inset-0 w-full h-full border-0"
              allow="autoplay; fullscreen; keyboard"
              title={title}
              onMouseEnter={(e) => e.currentTarget.focus()}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
