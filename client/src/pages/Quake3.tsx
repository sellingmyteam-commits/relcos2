import { Layout } from "@/components/Layout";
import { useRef, useEffect, useState } from "react";
import { SidebarChat } from "@/components/SidebarChat";

// ── Multiplayer server configuration ─────────────────────────────────────────
// The WebSocket redirect is handled inside public/game/quake3/index.html.
// To change the server URL, update QUAKE_SERVER_WSS in that file.
// ─────────────────────────────────────────────────────────────────────────────

export default function Quake3() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

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
        <div className="flex flex-1 overflow-hidden">
          <div ref={containerRef} className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">

            {/* Loading overlay — hidden once iframe fires onLoad */}
            {loading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black gap-4">
                <div className="text-cyan-400 font-mono text-2xl tracking-widest animate-pulse uppercase">
                  Loading Quake III...
                </div>
                <div className="w-48 h-1 bg-gray-800 rounded overflow-hidden">
                  <div className="h-full bg-cyan-400 animate-[loading-bar_1.5s_ease-in-out_infinite]" style={{ width: "60%" }} />
                </div>
                <div className="text-gray-500 font-mono text-xs mt-2">
                  Connecting to multiplayer server
                </div>
              </div>
            )}

            {/* 960×600 Quake iframe — WebSocket redirect is baked into the HTML */}
            <iframe
              src="/game/quake3/index.html"
              width={960}
              height={600}
              className="border-0 max-w-full max-h-full"
              allow="autoplay; fullscreen; keyboard; pointer-lock"
              title="Quake 3"
              data-testid="iframe-quake3"
              onLoad={() => setLoading(false)}
              onMouseEnter={(e) => e.currentTarget.focus()}
            />
          </div>
          <SidebarChat />
        </div>
      </div>
    </Layout>
  );
}
