import { Layout } from "@/components/Layout";
import { useRef, useEffect } from "react";
import { SidebarChat } from "@/components/SidebarChat";

export default function Eaglercraft() {
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
      <div className="flex flex-col h-[calc(100vh-5rem)] overflow-hidden">
        <div className="bg-red-600/20 border-b border-red-500/30 py-2 px-4 text-center shrink-0">
          <p className="text-red-500 font-bold text-sm">
            The game might take a while to load due to your ass laptops
          </p>
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div ref={containerRef} className="flex-1 relative bg-black group overflow-hidden">
            <iframe 
              src="/game/EaglercraftX_1.8_u53_Offline_Signed.html" 
              className="w-full h-full border-0"
              allow="autoplay; fullscreen; keyboard"
              title="Eaglercraft 1.8.8"
              onMouseEnter={(e) => e.currentTarget.focus()}
            />
          </div>
          <SidebarChat />
        </div>
      </div>
    </Layout>
  );
}
