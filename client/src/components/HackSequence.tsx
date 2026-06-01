import { useEffect, useState, useMemo, useRef } from "react";
import { getSharedSocket } from "@/lib/socket";

type Phase = "idle" | "glitch" | "dark" | "hacked" | "countdown" | "goodbye";

function makeGlitchBars(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    top: Math.random() * 100,
    height: 2 + Math.random() * 14,
    color: i % 3 === 0 ? "#ff003c" : i % 3 === 1 ? "#00fff9" : "#fff200",
    opacity: 0.12 + Math.random() * 0.55,
    duration: 0.05 + Math.random() * 0.2,
    delay: Math.random() * 0.15,
    xOffset: (Math.random() - 0.5) * 120,
  }));
}

function makeStaticDots(count: number) {
  return Array.from({ length: count }, () => ({
    top: Math.random() * 100,
    left: Math.random() * 100,
    size: 1 + Math.random() * 3,
    opacity: 0.3 + Math.random() * 0.7,
    duration: 0.06 + Math.random() * 0.12,
  }));
}

const SCRAMBLE_CHARS = "!@#$%^&*<>?/\\|[]{}~`▓▒░█▄▀QWERTY01";
const HACKED_TARGET = "HACKED BY QWERTY!!!";

export function HackSequence() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [hackedText, setHackedText] = useState(HACKED_TARGET);
  const [hackedVisible, setHackedVisible] = useState(true);
  const [goodbyeText, setGoodbyeText] = useState("GOODBYE HAHAHAHAHA");
  const [countdown, setCountdown] = useState(3);
  const [chromaShift, setChromaShift] = useState({ x: 0, y: 0 });
  const [shakeOffset, setShakeOffset] = useState({ x: 0, y: 0, skew: 0 });
  const [staticNoise, setStaticNoise] = useState(0);
  const [scanlineOffset, setScanlineOffset] = useState(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const glitchBars = useMemo(() => makeGlitchBars(35), []);
  const staticDots = useMemo(() => makeStaticDots(80), []);

  const addTimer = (fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timersRef.current.push(t);
    return t;
  };

  useEffect(() => {
    const socket = getSharedSocket();

    const onHack = () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];

      setPhase("glitch");
      setCountdown(3);
      setHackedText(HACKED_TARGET);

      addTimer(() => setPhase("dark"), 3200);
      addTimer(() => setPhase("hacked"), 3900);
      addTimer(() => {
        setPhase("countdown");
        setCountdown(3);
      }, 7200);
      addTimer(() => setCountdown(2), 8200);
      addTimer(() => setCountdown(1), 9200);
      addTimer(() => setPhase("goodbye"), 10200);
      addTimer(() => {
        try { window.close(); } catch {}
        try { window.location.replace("about:blank"); } catch {}
      }, 11500);
    };

    socket.on("qwerty_hack", onHack);
    return () => { socket.off("qwerty_hack", onHack); };
  }, []);

  // Glitch phase: heavy screen distortion loop
  useEffect(() => {
    if (phase !== "glitch") return;
    let frame = 0;
    const interval = setInterval(() => {
      frame++;
      setChromaShift({
        x: (Math.random() - 0.5) * 30,
        y: (Math.random() - 0.5) * 12,
      });
      setShakeOffset({
        x: (Math.random() - 0.5) * 24,
        y: (Math.random() - 0.5) * 16,
        skew: (Math.random() - 0.5) * 10,
      });
      setStaticNoise(Math.random());
      setScanlineOffset(Math.random() * 4);
    }, 60);
    return () => clearInterval(interval);
  }, [phase]);

  // Hacked phase: scramble text + flicker
  useEffect(() => {
    if (phase !== "hacked") return;
    let frame = 0;
    const scramble = setInterval(() => {
      frame++;
      if (frame > 22) {
        setHackedText(HACKED_TARGET);
        clearInterval(scramble);
        return;
      }
      setHackedText(
        HACKED_TARGET.split("").map((c, i) =>
          i < frame - 1 ? c : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
        ).join("")
      );
    }, 90);

    const flicker = setInterval(() => setHackedVisible(v => !v), 100);
    const stopFlicker = setTimeout(() => {
      clearInterval(flicker);
      setHackedVisible(true);
    }, 1400);

    let shakeFrame = 0;
    const shakeLoop = setInterval(() => {
      shakeFrame++;
      setShakeOffset({
        x: (Math.random() - 0.5) * 18,
        y: (Math.random() - 0.5) * 10,
        skew: (Math.random() - 0.5) * 6,
      });
    }, 80);

    return () => {
      clearInterval(scramble);
      clearInterval(flicker);
      clearTimeout(stopFlicker);
      clearInterval(shakeLoop);
    };
  }, [phase]);

  // Countdown: subtle shake
  useEffect(() => {
    if (phase !== "countdown") return;
    const shakeLoop = setInterval(() => {
      setShakeOffset({
        x: (Math.random() - 0.5) * 8,
        y: (Math.random() - 0.5) * 4,
        skew: (Math.random() - 0.5) * 3,
      });
    }, 100);
    return () => clearInterval(shakeLoop);
  }, [phase]);

  // Goodbye: full chaos — scrambling text, violent shake, chroma, flicker
  useEffect(() => {
    if (phase !== "goodbye") return;
    const GOODBYE_VARIANTS = [
      "GOODBYE HAHAHAHAHA",
      "G00DBY3 H4H4H4H4H4",
      "G̷O̸O̷D̸B̷Y̸E̷ HAHAHAHAHA",
      "▓▓▓BYE▓▓▓ HA▓HA▓HA▓",
      "GOODBYE HAHAHAHA!!",
      "G█ODBYE HA█AHAHA█A",
      "GΩΩ▒BYE HAHA▓▓▓▓▓",
    ];

    const shakeLoop = setInterval(() => {
      const intensity = 0.5 + Math.random();
      setShakeOffset({
        x: (Math.random() - 0.5) * 42 * intensity,
        y: (Math.random() - 0.5) * 24 * intensity,
        skew: (Math.random() - 0.5) * 18 * intensity,
      });
      setChromaShift({
        x: (Math.random() - 0.5) * 50,
        y: (Math.random() - 0.5) * 20,
      });
      setStaticNoise(Math.random());
      setScanlineOffset(Math.random() * 6);
    }, 55);

    const scrambleLoop = setInterval(() => {
      const pick = GOODBYE_VARIANTS[Math.floor(Math.random() * GOODBYE_VARIANTS.length)];
      setGoodbyeText(
        pick.split("").map(c =>
          Math.random() < 0.35
            ? SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
            : c
        ).join("")
      );
    }, 70);

    const flickerLoop = setInterval(() => setHackedVisible(v => !v), 80 + Math.random() * 60);

    return () => {
      clearInterval(shakeLoop);
      clearInterval(scrambleLoop);
      clearInterval(flickerLoop);
    };
  }, [phase]);

  if (phase === "idle") return null;

  const isBlack = phase === "dark" || phase === "hacked" || phase === "countdown" || phase === "goodbye";

  return (
    <>
      <style>{`
        @keyframes hs-bar {
          0%   { transform: translateX(0) scaleY(1);   opacity: 0.5; }
          25%  { transform: translateX(12px) scaleY(1.4); opacity: 0.9; }
          50%  { transform: translateX(-8px) scaleY(0.7); opacity: 0.3; }
          75%  { transform: translateX(6px) scaleY(1.2); opacity: 0.7; }
          100% { transform: translateX(0) scaleY(1);   opacity: 0.5; }
        }
        @keyframes hs-static {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 0.1; }
        }
        @keyframes hs-red-pulse {
          0%, 100% { text-shadow: 0 0 40px #ff003c, 0 0 80px #ff003c, 0 0 120px #ff003c, 6px 0 0 #00fff9, -6px 0 0 #00fff9; }
          50%      { text-shadow: 0 0 20px #ff003c, 0 0 50px #ff002080, 4px 0 0 #00fff9aa, -4px 0 0 #00fff9aa; }
        }
        @keyframes hs-countdown-in {
          from { opacity: 0; transform: scale(1.6); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes hs-goodbye-in {
          from { opacity: 0; letter-spacing: 1em; }
          to   { opacity: 1; letter-spacing: 0.1em; }
        }
        @keyframes hs-vignette-pulse {
          0%, 100% { opacity: 0.8; }
          50%       { opacity: 0.4; }
        }
        @keyframes hs-flicker-bg {
          0%, 95%, 100% { opacity: 1; }
          96%            { opacity: 0.2; }
          97%            { opacity: 0.9; }
          98%            { opacity: 0.1; }
          99%            { opacity: 0.85; }
        }
      `}</style>

      <div
        className="fixed inset-0 z-[99999] overflow-hidden"
        style={{
          background: isBlack ? "#000" : "rgba(0,0,0,0.92)",
          pointerEvents: "all",
          animation: phase === "glitch" ? "hs-flicker-bg 0.3s infinite" : "none",
        }}
      >
        {/* === GLITCH PHASE === */}
        {phase === "glitch" && (
          <div
            className="absolute inset-0"
            style={{
              transform: `translate(${shakeOffset.x}px, ${shakeOffset.y}px) skewX(${shakeOffset.skew}deg)`,
            }}
          >
            {/* Horizontal glitch bars */}
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
                  animation: `hs-bar ${bar.duration}s ${bar.delay}s infinite`,
                  transform: `translateX(${bar.xOffset}px)`,
                }}
              />
            ))}

            {/* Static noise dots */}
            {staticDots.map((dot, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  top: `${dot.top}%`,
                  left: `${dot.left}%`,
                  width: `${dot.size}px`,
                  height: `${dot.size}px`,
                  background: i % 3 === 0 ? "#ff003c" : i % 3 === 1 ? "#00fff9" : "#fff",
                  opacity: dot.opacity * staticNoise,
                  animation: `hs-static ${dot.duration}s infinite`,
                }}
              />
            ))}

            {/* Scanlines */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: `repeating-linear-gradient(0deg, rgba(0,0,0,0.25) 0px, rgba(0,0,0,0.25) 1px, transparent 1px, transparent ${3 + scanlineOffset}px)`,
            }} />

            {/* RGB chromatic aberration — red channel */}
            <div className="absolute inset-0" style={{
              background: "rgba(255,0,60,0.22)",
              transform: `translateX(${chromaShift.x * 1.5}px) translateY(${chromaShift.y}px)`,
              mixBlendMode: "screen" as const,
            }} />

            {/* RGB chromatic aberration — cyan channel */}
            <div className="absolute inset-0" style={{
              background: "rgba(0,255,249,0.18)",
              transform: `translateX(${-chromaShift.x}px) translateY(${chromaShift.y * 0.5}px)`,
              mixBlendMode: "screen" as const,
            }} />

            {/* Yellow distortion band */}
            <div className="absolute inset-0" style={{
              background: "rgba(255,220,0,0.08)",
              transform: `translateX(${chromaShift.x * 0.6}px) translateY(${-chromaShift.y * 0.8}px)`,
              mixBlendMode: "screen" as const,
            }} />

            {/* Vignette */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.75) 100%)",
              animation: "hs-vignette-pulse 0.4s infinite",
            }} />

            {/* Big center flash bar */}
            {staticNoise > 0.7 && (
              <div className="absolute left-0 right-0" style={{
                top: `${30 + staticNoise * 40}%`,
                height: "4px",
                background: "linear-gradient(90deg, transparent, #ff003c, #fff, #00fff9, transparent)",
                opacity: 0.9,
              }} />
            )}

            {/* Flickering "INCOMING" warning text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{
              opacity: staticNoise > 0.5 ? 0.6 : 0,
            }}>
              <span style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: "clamp(0.7rem, 3vw, 1.4rem)",
                fontWeight: 900,
                color: "#ff003c",
                letterSpacing: "0.6em",
                textShadow: "0 0 20px #ff003c",
                transform: `translateX(${chromaShift.x * 2}px)`,
              }}>
                ▓▓ SIGNAL COMPROMISED ▓▓
              </span>
            </div>
          </div>
        )}

        {/* === HACKED PHASE === */}
        {phase === "hacked" && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-6"
            style={{
              transform: `translate(${shakeOffset.x}px, ${shakeOffset.y}px) skewX(${shakeOffset.skew * 0.5}deg)`,
            }}
          >
            {/* Scanlines */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.35) 0px, rgba(0,0,0,0.35) 1px, transparent 1px, transparent 3px)",
            }} />

            {/* Red channel copy */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: "rgba(255,0,60,0.05)",
              transform: `translateX(${shakeOffset.x * 0.3}px)`,
              mixBlendMode: "screen" as const,
            }} />

            {/* Main hacked text */}
            <div
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: "clamp(2rem, 8vw, 6rem)",
                fontWeight: 900,
                color: "#ff003c",
                animation: "hs-red-pulse 0.4s infinite",
                letterSpacing: "0.04em",
                textAlign: "center",
                opacity: hackedVisible ? 1 : 0,
                transition: "opacity 0.04s",
                lineHeight: 1.1,
                padding: "0 1rem",
                position: "relative",
                zIndex: 10,
              }}
            >
              {/* Cyan ghost copy */}
              <span style={{
                position: "absolute",
                inset: 0,
                color: "rgba(0,255,249,0.3)",
                transform: `translate(${shakeOffset.x * 0.4}px, 3px)`,
                filter: "blur(2px)",
                userSelect: "none",
              }}>
                {hackedText}
              </span>
              {hackedText}
            </div>

            {/* Sub text */}
            <div style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "clamp(0.5rem, 2vw, 0.9rem)",
              color: "rgba(255,0,60,0.5)",
              letterSpacing: "0.5em",
              textTransform: "uppercase",
              position: "relative",
              zIndex: 10,
            }}>
              CONNECTION TERMINATED · SYSTEM BREACH DETECTED
            </div>
          </div>
        )}

        {/* === COUNTDOWN PHASE === */}
        {phase === "countdown" && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-8"
            style={{
              transform: `translate(${shakeOffset.x * 0.4}px, ${shakeOffset.y * 0.4}px)`,
            }}
          >
            <div style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "clamp(0.8rem, 3vw, 1.4rem)",
              fontWeight: 700,
              color: "#ff8080",
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              animation: "hs-countdown-in 0.4s ease-out",
            }}>
              TAB CLOSING IN
            </div>

            <div
              key={countdown}
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: "clamp(5rem, 20vw, 14rem)",
                fontWeight: 900,
                color: "#ff003c",
                lineHeight: 1,
                textShadow: "0 0 60px #ff003c, 0 0 120px #ff003c80, 8px 0 0 #00fff944, -8px 0 0 #00fff944",
                animation: "hs-countdown-in 0.25s ease-out",
              }}
            >
              {countdown}
            </div>

            {/* Progress dots */}
            <div className="flex gap-3">
              {[3, 2, 1].map(n => (
                <div key={n} style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: countdown <= n ? "#ff003c" : "rgba(255,0,60,0.15)",
                  boxShadow: countdown <= n ? "0 0 10px #ff003c" : "none",
                  transition: "all 0.2s",
                }} />
              ))}
            </div>

            {/* Scanlines */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 1px, transparent 1px, transparent 3px)",
            }} />
          </div>
        )}

        {/* === GOODBYE PHASE === */}
        {phase === "goodbye" && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-4"
            style={{
              transform: `translate(${shakeOffset.x}px, ${shakeOffset.y}px) skewX(${shakeOffset.skew}deg) skewY(${shakeOffset.skew * 0.3}deg)`,
            }}
          >
            {/* Scanlines */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: `repeating-linear-gradient(0deg, rgba(0,0,0,0.35) 0px, rgba(0,0,0,0.35) 1px, transparent 1px, transparent ${2 + scanlineOffset}px)`,
            }} />

            {/* Full-screen color flash */}
            {staticNoise > 0.6 && (
              <div className="absolute inset-0 pointer-events-none" style={{
                background: staticNoise > 0.85
                  ? "rgba(255,0,60,0.25)"
                  : staticNoise > 0.72
                    ? "rgba(0,255,249,0.12)"
                    : "rgba(255,220,0,0.1)",
                mixBlendMode: "screen" as const,
              }} />
            )}

            {/* Horizontal glitch bars flying across */}
            {staticNoise > 0.4 && Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="absolute left-0 right-0 pointer-events-none" style={{
                top: `${15 + i * 22 + staticNoise * 12}%`,
                height: `${2 + staticNoise * 8}px`,
                background: i % 2 === 0 ? "#ff003c" : "#00fff9",
                opacity: 0.5 + staticNoise * 0.4,
                transform: `translateX(${(chromaShift.x * (i % 2 === 0 ? 1 : -1)) * 2}px)`,
                mixBlendMode: "screen" as const,
              }} />
            ))}

            {/* Cyan ghost copy — large offset */}
            <div
              className="absolute pointer-events-none select-none"
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: "clamp(1.5rem, 6vw, 4.5rem)",
                fontWeight: 900,
                color: "rgba(0,255,249,0.25)",
                letterSpacing: "0.1em",
                textAlign: "center",
                padding: "0 1rem",
                transform: `translate(${chromaShift.x * 1.2}px, ${chromaShift.y * 0.8}px)`,
                filter: "blur(2px)",
                zIndex: 8,
              }}
            >
              {goodbyeText}
            </div>

            {/* Red ghost copy */}
            <div
              className="absolute pointer-events-none select-none"
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: "clamp(1.5rem, 6vw, 4.5rem)",
                fontWeight: 900,
                color: "rgba(255,0,60,0.3)",
                letterSpacing: "0.1em",
                textAlign: "center",
                padding: "0 1rem",
                transform: `translate(${-chromaShift.x * 0.8}px, ${chromaShift.y * 0.4}px)`,
                filter: "blur(1.5px)",
                zIndex: 9,
              }}
            >
              {goodbyeText}
            </div>

            {/* Main text */}
            <div style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "clamp(1.5rem, 6vw, 4.5rem)",
              fontWeight: 900,
              color: "#ff003c",
              textShadow: `0 0 30px #ff003c, 0 0 70px #ff003c80, ${chromaShift.x * 0.3}px 0 0 #00fff955, ${-chromaShift.x * 0.2}px 0 0 #00fff933`,
              letterSpacing: "0.1em",
              textAlign: "center",
              padding: "0 1rem",
              opacity: hackedVisible ? 1 : 0,
              transition: "opacity 0.03s",
              position: "relative",
              zIndex: 10,
              lineHeight: 1.1,
            }}>
              {goodbyeText}
            </div>

            {/* Corrupted sub-line */}
            <div style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "clamp(0.45rem, 1.5vw, 0.7rem)",
              color: staticNoise > 0.5 ? "rgba(0,255,249,0.5)" : "rgba(255,0,60,0.4)",
              letterSpacing: "0.4em",
              position: "relative",
              zIndex: 10,
              transform: `translateX(${chromaShift.x * 0.5}px)`,
            }}>
              ▓▓▓ SESSION TERMINATED BY QWERTY ▓▓▓
            </div>
          </div>
        )}
      </div>
    </>
  );
}
