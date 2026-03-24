import { useEffect, useRef } from "react";
import { SidebarChat } from "@/components/SidebarChat";
import { Layout } from "@/components/Layout";

export default function Rivals() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.focus();
    }
  }, []);

  return (
    <Layout>
      <div className="flex h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] overflow-hidden bg-background">
        <main className="flex-1 relative bg-black">
          <iframe
            ref={iframeRef}
            src="/games/rivals/Veck-io-main/Veck.html"
            className="absolute inset-0 w-full h-full border-0"
            allow="autoplay; fullscreen; keyboard; gamepad"
            title="Rivals"
            onLoad={() => iframeRef.current?.focus()}
          />
        </main>
        <SidebarChat />
      </div>
    </Layout>
  );
}