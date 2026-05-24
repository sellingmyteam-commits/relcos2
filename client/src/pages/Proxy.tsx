import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { SidebarChat } from "@/components/SidebarChat";
import { getSharedSocket } from "@/lib/socket";
import { ArrowRight, RefreshCw, Maximize2, Globe, Lock, AlertTriangle } from "lucide-react";

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return "https://" + trimmed;
}

export default function Proxy() {
  const [inputVal, setInputVal] = useState("");
  const [activeUrl, setActiveUrl] = useState("");
  const [key, setKey] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const socket = getSharedSocket();
    socket.emit("join_page", "/proxy");
    return () => {};
  }, []);

  const navigate = () => {
    const url = normalizeUrl(inputVal);
    if (!url) return;
    setBlocked(false);
    setActiveUrl(url);
    setInputVal(url);
    setKey(k => k + 1);
  };

  const reload = () => {
    setBlocked(false);
    setKey(k => k + 1);
  };

  const fullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  };

  const isSecure = activeUrl.startsWith("https://");

  return (
    <Layout noContainer>
      <div className="flex flex-col h-full w-full">
        {/* URL bar */}
        <div
          className="shrink-0 flex items-center gap-2 px-3 py-2 border-b"
          style={{
            background: "rgba(6,4,18,0.95)",
            borderColor: "rgba(155,93,229,0.2)",
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Secure indicator */}
          <div className="flex items-center shrink-0">
            {activeUrl ? (
              isSecure
                ? <Lock className="w-3.5 h-3.5 text-green-400" />
                : <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
            ) : (
              <Globe className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </div>

          {/* Input */}
          <form
            className="flex-1 flex items-center gap-2"
            onSubmit={e => { e.preventDefault(); navigate(); }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              placeholder="Enter a URL — e.g. google.com"
              data-testid="input-proxy-url"
              className="flex-1 h-8 px-3 rounded-lg text-xs font-mono outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(155,93,229,0.25)",
                color: "#e0f7ff",
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = "rgba(155,93,229,0.6)";
                e.currentTarget.style.background = "rgba(155,93,229,0.08)";
                e.currentTarget.select();
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = "rgba(155,93,229,0.25)";
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              }}
            />
            <button
              type="submit"
              data-testid="button-proxy-go"
              className="flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:scale-105 shrink-0"
              style={{ background: "rgba(155,93,229,0.25)", border: "1px solid rgba(155,93,229,0.4)" }}
            >
              <ArrowRight className="w-3.5 h-3.5 text-purple-300" />
            </button>
          </form>

          {/* Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={reload}
              data-testid="button-proxy-reload"
              disabled={!activeUrl}
              className="flex items-center justify-center w-7 h-7 rounded-lg transition-all hover:scale-105 disabled:opacity-30"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <RefreshCw className="w-3 h-3 text-muted-foreground" />
            </button>
            <button
              onClick={fullscreen}
              data-testid="button-proxy-fullscreen"
              disabled={!activeUrl}
              className="flex items-center justify-center w-7 h-7 rounded-lg transition-all hover:scale-105 disabled:opacity-30"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <Maximize2 className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Main area */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <div ref={containerRef} className="flex-1 relative bg-black overflow-hidden">
            {!activeUrl ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 select-none">
                <Globe className="w-10 h-10 text-muted-foreground/20" />
                <div className="text-center">
                  <p className="text-sm font-display font-bold text-white/30 uppercase tracking-widest mb-1">Web Proxy</p>
                  <p className="text-xs font-mono text-muted-foreground/30">Type a URL above and press enter</p>
                </div>
                <div className="flex flex-col items-center gap-1 mt-2">
                  {["google.com", "wikipedia.org", "github.com"].map(s => (
                    <button
                      key={s}
                      onClick={() => { setInputVal("https://" + s); setActiveUrl("https://" + s); setKey(k => k + 1); }}
                      className="text-[10px] font-mono text-muted-foreground/40 hover:text-purple-400/70 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : blocked ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 select-none">
                <AlertTriangle className="w-8 h-8 text-yellow-400/60" />
                <p className="text-sm font-mono text-muted-foreground/60 text-center max-w-xs">
                  This site blocked the proxy.<br />
                  <span className="text-[10px] text-muted-foreground/30">Some sites prevent iframe embedding.</span>
                </p>
                <button
                  onClick={() => window.open(activeUrl, "_blank")}
                  className="text-[10px] font-mono text-purple-400/60 hover:text-purple-400 transition-colors underline underline-offset-2"
                >
                  Open in new tab instead
                </button>
              </div>
            ) : (
              <iframe
                key={key}
                ref={iframeRef}
                src={activeUrl}
                className="absolute inset-0 w-full h-full border-0"
                allow="autoplay; fullscreen; keyboard"
                title="Proxy"
                onError={() => setBlocked(true)}
                data-testid="iframe-proxy"
              />
            )}
          </div>
          <SidebarChat />
        </div>
      </div>
    </Layout>
  );
}
