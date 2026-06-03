import { useEffect, useState, useMemo, useRef } from "react";
import { getSharedSocket } from "@/lib/socket";
import { Shield } from "lucide-react";

type Phase = "idle" | "glitch" | "warning" | "border" | "countdown" | "goodbye";

function makeGlitchBars(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    top: Math.random() * 100,
    height: 2 + Math.random() * 18,
    color: i % 3 === 0 ? "#ff9900" : i % 3 === 1 ? "#ffff00" : "#ff4400",
    opacity: 0.15 + Math.random() * 0.6,
    duration: 0.04 + Math.random() * 0.18,
    delay: Math.random() * 0.12,
    xOffset: (Math.random() - 0.5) * 140,
  }));
}

function makeStaticDots(count: number) {
  return Array.from({ length: count }, () => ({
    top: Math.random() * 100,
    left: Math.random() * 100,
    size: 1 + Math.random() * 4,
    opacity: 0.4 + Math.random() * 0.6,
    duration: 0.05 + Math.random() * 0.1,
  }));
}

export function ITSequence() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState(3);
  const [shakeOffset, setShakeOffset] = useState({ x: 0, y: 0, skew: 0 });
  const [staticNoise, setStaticNoise] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const [hue, setHue] = useState(0);
  const [warningVisible, setWarningVisible] = useState(true);
  const [borderGlow, setBorderGlow] = useState(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const glitchBars = useMemo(() => makeGlitchBars(40), []);
  const staticDots = useMemo(() => makeStaticDots(90), []);

  const addTimer = (fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timersRef.current.push(t);
    return t;
  };

  useEffect(() => {
    const socket = getSharedSocket();

    const onIT = () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];

      setPhase("glitch");
      setCountdown(3);
      setWarningVisible(true);
      setBorderGlow(0);

      addTimer(() => setPhase("warning"), 2800);
      addTimer(() => {
        setWarningVisible(false);
      }, 5800);
      addTimer(() => {
        setPhase("border");
        setBorderGlow(1);
      }, 6400);
      addTimer(() => {
        setPhase("countdown");
        setCountdown(3);
      }, 7000);
      addTimer(() => setCountdown(2), 8000);
      addTimer(() => setCountdown(1), 9000);
      addTimer(() => setPhase("goodbye"), 10000);
      addTimer(() => {
        try { window.close(); } catch {}
        try { window.location.replace("about:blank"); } catch {}
      }, 12500);
    };

    socket.on("it_hack", onIT);
    return () => { socket.off("it_hack", onIT); };
  }, []);

  useEffect(() => {
    if (phase !== "glitch") return;
    let frame = 0;
    const interval = setInterval(() => {
      frame++;
      setShakeOffset({
        x: (Math.random() - 0.5) * 28,
        y: (Math.random() - 0.5) * 18,
        skew: (Math.random() - 0.5) * 12,
      });
      setStaticNoise(Math.random());
      setSaturation(200 + Math.random() * 600);
      setBrightness(80 + Math.random() * 120);
      setHue(Math.random() * 360);
    }, 55);
    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (phase !== "border" && phase !== "countdown" && phase !== "goodbye") return;
    const interval = setInterval(() => {
      setBorderGlow(0.6 + Math.random() * 0.4);
      setShakeOffset({
        x: (Math.random() - 0.5) * (phase === "goodbye" ? 14 : 5),
        y: (Math.random() - 0.5) * (phase === "goodbye" ? 8 : 3),
        skew: (Math.random() - 0.5) * (phase === "goodbye" ? 5 : 2),
      });
    }, 80);
    return () => clearInterval(interval);
  }, [phase]);

  if (phase === "idle") return null;

  const isBlackBg = phase === "warning" || phase === "border" || phase === "countdown" || phase === "goodbye";

  return (
    <>
      <style>{`
        @keyframes it-bar {
          0%   { transform: translateX(0) scaleY(1); opacity: 0.5; }
          25%  { transform: translateX(16px) scaleY(1.6); opacity: 1; }
          50%  { transform: translateX(-10px) scaleY(0.6); opacity: 0.3; }
          75%  { transform: translateX(8px) scaleY(1.3); opacity: 0.8; }
          100% { transform: translateX(0) scaleY(1); opacity: 0.5; }
        }
        @keyframes it-static {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 0.1; }
        }
        @keyframes it-shield-spin {
          0%   { transform: rotate(0deg) scale(1); }
          25%  { transform: rotate(90deg) scale(1.08); }
          50%  { transform: rotate(180deg) scale(1); }
          75%  { transform: rotate(270deg) scale(1.08); }
          100% { transform: rotate(360deg) scale(1); }
        }
        @keyframes it-shield-pulse {
          0%, 100% { filter: drop-shadow(0 0 20px #00aaff) drop-shadow(0 0 50px #0055ff); }
          50%       { filter: drop-shadow(0 0 40px #00ccff) drop-shadow(0 0 90px #0077ff) drop-shadow(0 0 120px #0033ff); }
        }
        @keyframes it-text-in {
          from { opacity: 0; letter-spacing: 0.5em; transform: scaleX(1.15); }
          to   { opacity: 1; letter-spacing: 0.06em; transform: scaleX(1); }
        }
        @keyframes it-text-fade {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        @keyframes it-border-in {
          from { opacity: 0; box-shadow: inset 0 0 0px #ff0000; }
          to   { opacity: 1; box-shadow: inset 0 0 60px #ff0000, inset 0 0 120px #ff000033; }
        }
        @keyframes it-countdown-in {
          from { opacity: 0; transform: scale(1.8); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes it-goodbye-in {
          from { opacity: 0; letter-spacing: 1.2em; }
          to   { opacity: 1; letter-spacing: 0.1em; }
        }
        @keyframes it-flicker-bg {
          0%, 94%, 100% { opacity: 1; }
          95% { opacity: 0.15; }
          96% { opacity: 0.85; }
          97% { opacity: 0.1; }
          98% { opacity: 0.9; }
        }
        @keyframes it-red-border-pulse {
          0%, 100% { box-shadow: inset 0 0 40px rgba(255,0,0,0.6), inset 0 0 80px rgba(255,0,0,0.2), 0 0 30px rgba(255,0,0,0.4); border-color: rgba(255,0,0,0.9); }
          50%       { box-shadow: inset 0 0 80px rgba(255,0,0,0.9), inset 0 0 140px rgba(255,0,0,0.35), 0 0 60px rgba(255,0,0,0.7); border-color: rgba(255,50,50,1); }
        }
        @keyframes it-subtext-blink {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 0.15; }
        }
      `}</style>

      <div
        className="fixed inset-0 z-[99999] overflow-hidden pointer-events-all"
        style={{
          background: isBlackBg ? "#000" : "transparent",
          animation: phase === "glitch" ? "it-flicker-bg 0.25s infinite" : "none",
        }}
      >
        {/* === GLITCH / DEEPFRY PHASE === */}
        {phase === "glitch" && (
          <div
            className="absolute inset-0"
            style={{
              transform: `translate(${shakeOffset.x}px, ${shakeOffset.y}px) skewX(${shakeOffset.skew}deg)`,
              filter: `saturate(${saturation}%) brightness(${brightness}%) hue-rotate(${hue}deg) contrast(180%)`,
            }}
          >
            {/* Capture the actual page content behind with a deep-fry overlay */}
            <div className="absolute inset-0" style={{
              background: `rgba(255, 140, 0, ${0.15 + staticNoise * 0.35})`,
              mixBlendMode: "multiply",
            }} />
            <div className="absolute inset-0" style={{
              background: `rgba(255, 255, 0, ${0.1 + staticNoise * 0.2})`,
              mixBlendMode: "screen",
            }} />

            {/* Glitch bars */}
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
                  animation: `it-bar ${bar.duration}s ${bar.delay}s infinite`,
                  transform: `translateX(${bar.xOffset}px)`,
                }}
              />
            ))}

            {/* Static dots */}
            {staticDots.map((dot, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  top: `${dot.top}%`,
                  left: `${dot.left}%`,
                  width: `${dot.size}px`,
                  height: `${dot.size}px`,
                  background: i % 3 === 0 ? "#ff9900" : i % 3 === 1 ? "#ffff00" : "#ff4400",
                  opacity: dot.opacity * staticNoise,
                  animation: `it-static ${dot.duration}s infinite`,
                }}
              />
            ))}

            {/* Scanlines */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 1px, transparent 1px, transparent 3px)",
            }} />

            {/* Center flash warning */}
            {staticNoise > 0.65 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "clamp(0.8rem, 3vw, 1.6rem)",
                  fontWeight: 900,
                  color: "#ffff00",
                  letterSpacing: "0.4em",
                  textShadow: "0 0 20px #ff9900, 0 0 40px #ffff00",
                  opacity: staticNoise,
                }}>
                  ▓▓ SIGNAL INTERCEPTED ▓▓
                </span>
              </div>
            )}
          </div>
        )}

        {/* === WARNING PHASE (black screen + blue shield + text) === */}
        {(phase === "warning" || (phase === "border" && !warningVisible)) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-8">
            {/* Scanlines */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 1px, transparent 1px, transparent 4px)",
            }} />

            {/* Blue spinning shield */}
            <div style={{
              animation: "it-shield-spin 2s linear infinite, it-shield-pulse 1.5s ease-in-out infinite",
              position: "relative",
              zIndex: 10,
            }}>
              <Shield
                style={{
                  width: "clamp(80px, 14vw, 130px)",
                  height: "clamp(80px, 14vw, 130px)",
                  color: "#00aaff",
                  filter: "drop-shadow(0 0 20px #00aaff) drop-shadow(0 0 50px #0055ff)",
                  strokeWidth: 1.5,
                }}
              />
            </div>

            {/* Warning text */}
            <div
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: "clamp(0.9rem, 3vw, 1.6rem)",
                fontWeight: 900,
                color: "#00aaff",
                textShadow: "0 0 15px #00aaff, 0 0 35px #0055ff, 0 0 60px #0033ff",
                letterSpacing: "0.06em",
                textAlign: "center",
                padding: "0 2rem",
                maxWidth: "800px",
                lineHeight: 1.5,
                animation: warningVisible
                  ? "it-text-in 0.6s ease-out forwards"
                  : "it-text-fade 0.6s ease-in forwards",
                position: "relative",
                zIndex: 10,
              }}
            >
              I.T HAS DETECTED GAMES ON THIS SITE<br />
              YOU NEED TO GET BACK TO WORK
            </div>

            {/* Sub line */}
            <div style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "clamp(0.45rem, 1.5vw, 0.75rem)",
              color: "rgba(0,170,255,0.5)",
              letterSpacing: "0.5em",
              textTransform: "uppercase",
              animation: warningVisible ? "it-subtext-blink 1s infinite" : "it-text-fade 0.6s ease-in forwards",
              position: "relative",
              zIndex: 10,
            }}>
              POLICY VIOLATION DETECTED · REMOTE ACTION INITIATED
            </div>
          </div>
        )}

        {/* === BORDER + COUNTDOWN + GOODBYE PHASES === */}
        {(phase === "border" || phase === "countdown" || phase === "goodbye") && (
          <div
            className="absolute inset-0 border-[6px] flex flex-col items-center justify-center gap-6"
            style={{
              borderColor: "rgba(255,0,0,0.9)",
              animation: "it-red-border-pulse 0.6s ease-in-out infinite",
              transform: `translate(${shakeOffset.x * 0.4}px, ${shakeOffset.y * 0.4}px)`,
            }}
          >
            {/* Scanlines */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.25) 0px, rgba(0,0,0,0.25) 1px, transparent 1px, transparent 3px)",
            }} />

            {phase === "border" && (
              <div style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: "clamp(0.9rem, 3vw, 1.5rem)",
                fontWeight: 900,
                color: "#ff2222",
                textShadow: "0 0 15px #ff0000, 0 0 40px #ff000088",
                letterSpacing: "0.08em",
                textAlign: "center",
                animation: "it-text-in 0.5s ease-out",
                position: "relative",
                zIndex: 10,
              }}>
                INITIATING REMOTE SHUTDOWN...
              </div>
            )}

            {phase === "countdown" && (
              <>
                <div style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "clamp(0.8rem, 2.5vw, 1.2rem)",
                  fontWeight: 700,
                  color: "#ff6666",
                  letterSpacing: "0.4em",
                  textTransform: "uppercase",
                  position: "relative",
                  zIndex: 10,
                }}>
                  REMOTE SHUTTING TAB IN
                </div>
                <div
                  key={countdown}
                  style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: "clamp(6rem, 22vw, 16rem)",
                    fontWeight: 900,
                    color: "#ff0000",
                    lineHeight: 1,
                    textShadow: "0 0 60px #ff0000, 0 0 120px #ff000080, 0 0 200px #ff000040",
                    animation: "it-countdown-in 0.3s ease-out",
                    position: "relative",
                    zIndex: 10,
                  }}
                >
                  {countdown}
                </div>
                <div className="flex gap-3" style={{ position: "relative", zIndex: 10 }}>
                  {[3, 2, 1].map(n => (
                    <div key={n} style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      background: countdown <= n ? "#ff0000" : "rgba(255,0,0,0.15)",
                      boxShadow: countdown <= n ? "0 0 12px #ff0000" : "none",
                      transition: "all 0.2s",
                    }} />
                  ))}
                </div>
              </>
            )}

            {phase === "goodbye" && (
              <div style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: "clamp(1rem, 4vw, 2.8rem)",
                fontWeight: 900,
                color: "#ff0000",
                textShadow: "0 0 30px #ff0000, 0 0 70px #ff000080",
                letterSpacing: "0.1em",
                textAlign: "center",
                padding: "0 2rem",
                animation: "it-goodbye-in 0.5s ease-out",
                lineHeight: 1.3,
                position: "relative",
                zIndex: 10,
              }}>
                MAYBE NOW YOU KIDS<br />WILL DO SOME WORK
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
