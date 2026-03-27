import { Layout } from "@/components/Layout";
import { useRef, useEffect } from "react";
import { SidebarChat } from "@/components/SidebarChat";

export default function BabySniperVietnam() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleToggleFullscreen = () => {
      if (containerRef.current) {
        if (!document.fullscreenElement) {
          containerRef.current.requestFullscreen().catch((err) => {
            console.error(`Error attempting to enable full-screen mode: ${err.message}`);
          });
        } else {
          document.exitFullscreen();
        }
      }
    };
    window.addEventListener('toggle-fullscreen', handleToggleFullscreen);
    return () => window.removeEventListener('toggle-fullscreen', handleToggleFullscreen);
  }, []);

  return (
    <Layout noContainer>
      <div className="flex h-[calc(100vh-5rem)] overflow-hidden">
        <div ref={containerRef} className="flex-1 relative bg-black group overflow-hidden">
          <iframe
            src="/game/baby-sniper/index.html"
            className="w-full h-full border-0"
            allow="autoplay; fullscreen; keyboard; pointer-lock"
            title="Baby Sniper in Vietnam"
            data-testid="iframe-baby-sniper-vietnam"
            onMouseEnter={(e) => e.currentTarget.focus()}
          />
        </div>
        <SidebarChat />
      </div>
    </Layout>
  );
}
