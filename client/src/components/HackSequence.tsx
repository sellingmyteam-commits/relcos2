import { useEffect, useState } from "react";
import { getSharedSocket } from "@/lib/socket";

type Phase = "idle" | "glitch" | "dark" | "text" | "done";

export function HackSequence() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [glitchText, setGlitchText] = useState("HACKED BY QWERTY!!!!!");
  const [textVisible, setTextVisible] = useState(true);

  useEffect(() => {
    const socket = getSharedSocket();

    const onHack = () => {
      setPhase("glitch");

      // Try fullscreen
      try {
        document.documentElement.requestFullscreen?.();
      } catch {}

      setTimeout(() => setPhase("dark"), 2200);
      setTimeout(() => { setPhase("text"); }, 3000);
      setTimeout(() => {
        try { window.close(); } catch {}
        // fallback if window.close() is blocked
        document.body.innerHTML = "";
        document.title = "HACKED";
      }, 6500);
    };

    socket.on("qwerty_hack", onHack);
    return () => { socket.off("qwerty_hack", onHack); };
  }, []);

  // Glitch text scrambler
  useEffect(() => {
    if (phase !== "text") return;
    const chars = "!@#$%^&*<>?/\\|[]{}~`QWERTY";
    const target = "HACKED BY QWERTY!!!!!";
    let frame = 0;
    const interval = setInterval(() => {
      frame++;
      if (frame > 18) {
        setGlitchText(target);
        clearInterval(interval);
        return;
      }
      const scrambled = target.split("").map((c, i) =>
        i < frame ? c : chars[Math.floor(Math.random() * chars.length)]
      ).join("");
      setGlitchText(scrambled);
    }, 80);

    // Flicker
    const flicker = setInterval(() => {
      setTextVisible(v => !v);
    }, 120);
    setTimeout(() => {
      clearInterval(flicker);
      setTextVisible(true);
    }, 1200);

    return () => { clearInterval(interval); clearInterval(flicker); };
  }, [phase]);

  if (phase === "idle") return null;

  return (
    <div
      className="fixed inset-0 z-[99999]"
      style={{
        background: phase === "dark" || phase === "text" ? "#000" : "transparent",
        pointerEvents: "all",
      }}
    >
      {/* Glitch phase — noise overlay */}
      {phase === "glitch" && (
        <div className="absolute inset-0" style={{ animation: "qwerty-shake 0.08s infinite" }}>
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                top: `${Math.random() * 100}%`,
                left: 0,
                right: 0,
                height: `${2 + Math.random() * 8}px`,
                background: i % 3 === 0 ? "#ff003c" : i % 3 === 1 ? "#00fff9" : "#fff",
                opacity: 0.15 + Math.random() * 0.4,
                mixBlendMode: "screen",
                animation: `qwerty-glitch-bar ${0.1 + Math.random() * 0.3}s infinite`,
              }}
            />
          ))}
          <div className="absolute inset-0" style={{
            background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 4px)",
          }} />
          {/* Red/cyan channel split */}
          <div className="absolute inset-0" style={{
            background: "rgba(255,0,60,0.18)",
            transform: "translateX(-6px)",
            mixBlendMode: "screen",
          }} />
          <div className="absolute inset-0" style={{
            background: "rgba(0,255,249,0.18)",
            transform: "translateX(6px)",
            mixBlendMode: "screen",
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
          {/* Glitch decorations */}
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute" style={{
              top: `${10 + i * 14}%`,
              left: `${Math.random() * 60}%`,
              width: `${30 + Math.random() * 40}%`,
              height: "2px",
              background: i % 2 === 0 ? "#ff003c" : "#00fff9",
              opacity: 0.4,
              animation: `qwerty-glitch-bar ${0.15 + Math.random() * 0.25}s infinite`,
            }} />
          ))}
          <div
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "clamp(1.5rem, 5vw, 3.5rem)",
              fontWeight: 900,
              color: "#ff003c",
              textShadow: "0 0 30px #ff003c, 0 0 60px #ff003c, 4px 0 0 #00fff9, -4px 0 0 #00fff9",
              letterSpacing: "0.05em",
              opacity: textVisible ? 1 : 0,
              transition: "opacity 0.05s",
              animation: "qwerty-shake 0.06s infinite",
            }}
          >
            {glitchText}
          </div>
          <div style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: "clamp(0.6rem, 2vw, 1rem)",
            color: "#ffffff44",
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            animation: "qwerty-shake 0.12s infinite",
          }}>
            CONNECTION TERMINATED
          </div>
        </div>
      )}

      <style>{`
        @keyframes qwerty-shake {
          0%   { transform: translate(0, 0); }
          20%  { transform: translate(-3px, 2px); }
          40%  { transform: translate(3px, -2px); }
          60%  { transform: translate(-2px, -3px); }
          80%  { transform: translate(2px, 3px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes qwerty-glitch-bar {
          0%   { transform: translateX(0); opacity: 0.3; }
          33%  { transform: translateX(8px); opacity: 0.7; }
          66%  { transform: translateX(-5px); opacity: 0.2; }
          100% { transform: translateX(0); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
