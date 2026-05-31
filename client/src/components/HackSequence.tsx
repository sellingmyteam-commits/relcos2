import { useEffect, useState, useMemo } from "react";
import { getSharedSocket } from "@/lib/socket";

type Phase = "idle" | "glitch" | "dark" | "text";

// Pre-compute random values so they don't change on re-render
function makeGlitchBars(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    top: Math.random() * 100,
    height: 2 + Math.random() * 8,
    color: i % 3 === 0 ? "#ff003c" : i % 3 === 1 ? "#00fff9" : "#fff",
    opacity: 0.15 + Math.random() * 0.4,
    duration: 0.1 + Math.random() * 0.3,
  }));
}

function makeTextBars(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    left: Math.random() * 60,
    width: 30 + Math.random() * 40,
    color: i % 2 === 0 ? "#ff003c" : "#00fff9",
    duration: 0.15 + Math.random() * 0.25,
  }));
}

export function HackSequence() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [glitchText, setGlitchText] = useState("HACKED BY QWERTY!!!!!");
  const [textVisible, setTextVisible] = useState(true);

  // Stable random values — only recomputed when needed
  const glitchBars = useMemo(() => makeGlitchBars(20), []);
  const textBars = useMemo(() => makeTextBars(6), []);

  useEffect(() => {
    const socket = getSharedSocket();

    const onHack = () => {
      setPhase("glitch");

      try { document.documentElement.requestFullscreen?.(); } catch {}

      setTimeout(() => setPhase("dark"), 2200);
      setTimeout(() => setPhase("text"), 3000);
      setTimeout(() => {
        // Try to close — works only if opened by JS
        try { window.close(); } catch {}
        // Fallback: navigate away
        try { window.location.replace("about:blank"); } catch {}
      }, 6500);
    };

    socket.on("qwerty_hack", onHack);
    return () => { socket.off("qwerty_hack", onHack); };
  }, []);

  // Text scrambler + flicker — only runs in "text" phase
  useEffect(() => {
    if (phase !== "text") return;
    const chars = "!@#$%^&*<>?/\\|[]{}~`QWERTY";
    const target = "HACKED BY QWERTY!!!!!";
    let frame = 0;

    const scramble = setInterval(() => {
      frame++;
      if (frame > 18) {
        setGlitchText(target);
        clearInterval(scramble);
        return;
      }
      setGlitchText(
        target.split("").map((c, i) =>
          i < frame ? c : chars[Math.floor(Math.random() * chars.length)]
        ).join("")
      );
    }, 80);

    const flicker = setInterval(() => setTextVisible(v => !v), 120);
    const stopFlicker = setTimeout(() => {
      clearInterval(flicker);
      setTextVisible(true);
    }, 1200);

    return () => {
      clearInterval(scramble);
      clearInterval(flicker);
      clearTimeout(stopFlicker);
    };
  }, [phase]);

  if (phase === "idle") return null;

  return (
    <>
      <style>{`
        @keyframes hs-shake {
          0%   { transform: translate(0, 0); }
          20%  { transform: translate(-3px, 2px); }
          40%  { transform: translate(3px, -2px); }
          60%  { transform: translate(-2px, -3px); }
          80%  { transform: translate(2px, 3px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes hs-bar {
          0%   { transform: translateX(0);   opacity: 0.3; }
          33%  { transform: translateX(8px);  opacity: 0.7; }
          66%  { transform: translateX(-5px); opacity: 0.2; }
          100% { transform: translateX(0);   opacity: 0.5; }
        }
        @keyframes hs-shake-slow {
          0%   { transform: translate(0, 0); }
          25%  { transform: translate(-2px, 1px); }
          50%  { transform: translate(2px, -1px); }
          75%  { transform: translate(-1px, -2px); }
          100% { transform: translate(0, 0); }
        }
      `}</style>

      <div
        className="fixed inset-0 z-[99999]"
        style={{
          background: phase === "dark" || phase === "text" ? "#000" : "transparent",
          pointerEvents: "all",
        }}
      >
        {/* Glitch phase */}
        {phase === "glitch" && (
          <div className="absolute inset-0" style={{ animation: "hs-shake 0.08s infinite" }}>
            {glitchBars.map((bar, i) => (
              <div
                key={i}
                className="absolute left-0 right-0"
                style={{
                  top: `${bar.top}%`,
                  height: `${bar.height}px`,
                  background: bar.color,
                  opacity: bar.opacity,
                  mixBlendMode: "screen" as const,
                  animation: `hs-bar ${bar.duration}s infinite`,
                }}
              />
            ))}
            {/* Scanlines */}
            <div className="absolute inset-0" style={{
              background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 4px)",
            }} />
            {/* Red channel */}
            <div className="absolute inset-0" style={{
              background: "rgba(255,0,60,0.18)",
              transform: "translateX(-6px)",
              mixBlendMode: "screen" as const,
            }} />
            {/* Cyan channel */}
            <div className="absolute inset-0" style={{
              background: "rgba(0,255,249,0.18)",
              transform: "translateX(6px)",
              mixBlendMode: "screen" as const,
            }} />
          </div>
        )}

        {/* Text phase */}
        {phase === "text" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
            {/* Scanlines */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.4) 0px, rgba(0,0,0,0.4) 1px, transparent 1px, transparent 3px)",
            }} />
            {/* Glitch bars */}
            {textBars.map((bar, i) => (
              <div key={i} className="absolute" style={{
                top: `${10 + i * 14}%`,
                left: `${bar.left}%`,
                width: `${bar.width}%`,
                height: "2px",
                background: bar.color,
                opacity: 0.4,
                animation: `hs-bar ${bar.duration}s infinite`,
              }} />
            ))}
            {/* Main text */}
            <div style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "clamp(1.5rem, 5vw, 3.5rem)",
              fontWeight: 900,
              color: "#ff003c",
              textShadow: "0 0 30px #ff003c, 0 0 60px #ff003c, 4px 0 0 #00fff9, -4px 0 0 #00fff9",
              letterSpacing: "0.05em",
              opacity: textVisible ? 1 : 0,
              transition: "opacity 0.05s",
              animation: "hs-shake 0.06s infinite",
              position: "relative",
              zIndex: 10,
            }}>
              {glitchText}
            </div>
            <div style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "clamp(0.6rem, 2vw, 1rem)",
              color: "#ffffff44",
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              animation: "hs-shake-slow 0.12s infinite",
              position: "relative",
              zIndex: 10,
            }}>
              CONNECTION TERMINATED
            </div>
          </div>
        )}
      </div>
    </>
  );
}
