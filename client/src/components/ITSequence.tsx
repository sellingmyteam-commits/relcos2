import { useEffect, useState, useMemo, useRef } from "react";
import { getSharedSocket } from "@/lib/socket";
import { Shield } from "lucide-react";

type Phase = "idle" | "error" | "glitch" | "warning" | "border" | "countdown" | "goodbye";

function makeGlitchBars(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    top: Math.random() * 100,
    height: 2 + Math.random() * 30,
    color: i % 4 === 0 ? "#ff0000" : i % 4 === 1 ? "#ff9900" : i % 4 === 2 ? "#ffff00" : "#00ffff",
    opacity: 0.3 + Math.random() * 0.7,
    duration: 0.02 + Math.random() * 0.1,
    delay: Math.random() * 0.08,
    xOffset: (Math.random() - 0.5) * 200,
    width: 60 + Math.random() * 40,
  }));
}

function makeStaticDots(count: number) {
  return Array.from({ length: count }, () => ({
    top: Math.random() * 100,
    left: Math.random() * 100,
    size: 1 + Math.random() * 5,
    opacity: 0.5 + Math.random() * 0.5,
    duration: 0.03 + Math.random() * 0.07,
  }));
}

export function ITSequence() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState(3);
  const [shakeOffset, setShakeOffset] = useState({ x: 0, y: 0, skew: 0, skewY: 0, scale: 1 });
  const [staticNoise, setStaticNoise] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const [hue, setHue] = useState(0);
  const [contrast, setContrast] = useState(100);
  const [warningVisible, setWarningVisible] = useState(true);
  const [borderGlow, setBorderGlow] = useState(0);
  const [tearOffset, setTearOffset] = useState({ top: 30, mid: 60, shift1: 0, shift2: 0, shift3: 0 });
  const [flashColor, setFlashColor] = useState<string | null>(null);
  const [errorVisible, setErrorVisible] = useState(true);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const glitchBars = useMemo(() => makeGlitchBars(80), []);
  const staticDots = useMemo(() => makeStaticDots(160), []);

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

      setPhase("error");
      setErrorVisible(true);
      setCountdown(3);
      setWarningVisible(true);
      setBorderGlow(0);

      addTimer(() => setPhase("glitch"), 1800);
      addTimer(() => setPhase("warning"), 5800);
      addTimer(() => setWarningVisible(false), 8800);
      addTimer(() => { setPhase("border"); setBorderGlow(1); }, 9400);
      addTimer(() => { setPhase("countdown"); setCountdown(3); }, 10000);
      addTimer(() => setCountdown(2), 11000);
      addTimer(() => setCountdown(1), 12000);
      addTimer(() => setPhase("goodbye"), 13000);
      addTimer(() => {
        try { window.close(); } catch {}
        try { window.location.replace("about:blank"); } catch {}
      }, 15500);
    };

    socket.on("it_hack", onIT);
    return () => { socket.off("it_hack", onIT); };
  }, []);

  // Intense glitch loop
  useEffect(() => {
    if (phase !== "glitch") return;
    const interval = setInterval(() => {
      setShakeOffset({
        x: (Math.random() - 0.5) * 60,
        y: (Math.random() - 0.5) * 40,
        skew: (Math.random() - 0.5) * 25,
        skewY: (Math.random() - 0.5) * 15,
        scale: 0.92 + Math.random() * 0.18,
      });
      setStaticNoise(Math.random());
      setSaturation(300 + Math.random() * 900);
      setBrightness(40 + Math.random() * 200);
      setHue(Math.random() * 360);
      setContrast(150 + Math.random() * 250);
      setTearOffset({
        top: 10 + Math.random() * 40,
        mid: 50 + Math.random() * 30,
        shift1: (Math.random() - 0.5) * 120,
        shift2: (Math.random() - 0.5) * 80,
        shift3: (Math.random() - 0.5) * 140,
      });
      const colors = ["rgba(255,0,0,0.3)", "rgba(0,255,255,0.2)", "rgba(255,255,0,0.25)", "rgba(255,0,255,0.2)", null];
      setFlashColor(colors[Math.floor(Math.random() * colors.length)]);
    }, 30);
    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (phase !== "border" && phase !== "countdown" && phase !== "goodbye") return;
    const interval = setInterval(() => {
      setBorderGlow(0.6 + Math.random() * 0.4);
      setShakeOffset({
        x: (Math.random() - 0.5) * (phase === "goodbye" ? 18 : 6),
        y: (Math.random() - 0.5) * (phase === "goodbye" ? 10 : 4),
        skew: (Math.random() - 0.5) * (phase === "goodbye" ? 6 : 2),
        skewY: 0,
        scale: 1,
      });
    }, 80);
    return () => clearInterval(interval);
  }, [phase]);

  if (phase === "idle") return null;

  const isBlackBg = phase !== "error" && phase !== "glitch";

  return (
    <>
      <style>{`
        @keyframes it-bar {
          0%   { transform: translateX(0) scaleY(1) scaleX(1); opacity: 0.6; }
          20%  { transform: translateX(30px) scaleY(2) scaleX(1.3); opacity: 1; }
          40%  { transform: translateX(-20px) scaleY(0.4) scaleX(0.8); opacity: 0.2; }
          60%  { transform: translateX(15px) scaleY(1.8) scaleX(1.1); opacity: 0.9; }
          80%  { transform: translateX(-35px) scaleY(0.7) scaleX(1.4); opacity: 0.4; }
          100% { transform: translateX(0) scaleY(1) scaleX(1); opacity: 0.6; }
        }
        @keyframes it-static {
          0%, 100% { opacity: 1; transform: scale(1); }
          33% { opacity: 0.1; transform: scale(1.5); }
          66% { opacity: 0.8; transform: scale(0.5); }
        }
        @keyframes it-shield-vertical {
          0%   { transform: perspective(400px) rotateY(0deg); }
          100% { transform: perspective(400px) rotateY(360deg); }
        }
        @keyframes it-shield-pulse {
          0%, 100% { filter: drop-shadow(0 0 20px #00aaff) drop-shadow(0 0 50px #0055ff); }
          50%       { filter: drop-shadow(0 0 50px #00ddff) drop-shadow(0 0 100px #0077ff) drop-shadow(0 0 160px #0033ff); }
        }
        @keyframes it-text-in {
          from { opacity: 0; letter-spacing: 0.5em; transform: scaleX(1.15); }
          to   { opacity: 1; letter-spacing: 0.06em; transform: scaleX(1); }
        }
        @keyframes it-text-fade {
          from { opacity: 1; }
          to   { opacity: 0; }
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
          0%, 88%, 100% { opacity: 1; }
          89% { opacity: 0.05; }
          90% { opacity: 0.9; }
          91% { opacity: 0.0; }
          92% { opacity: 0.7; }
          93% { opacity: 0.1; }
          94% { opacity: 1; }
        }
        @keyframes it-red-border-pulse {
          0%, 100% { box-shadow: inset 0 0 40px rgba(255,0,0,0.6), inset 0 0 80px rgba(255,0,0,0.2), 0 0 30px rgba(255,0,0,0.4); border-color: rgba(255,0,0,0.9); }
          50%       { box-shadow: inset 0 0 80px rgba(255,0,0,0.9), inset 0 0 140px rgba(255,0,0,0.35), 0 0 60px rgba(255,0,0,0.7); border-color: rgba(255,50,50,1); }
        }
        @keyframes it-subtext-blink {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 0.1; }
        }
        @keyframes it-error-flicker {
          0%, 90%, 100% { opacity: 1; }
          91% { opacity: 0.3; }
          93% { opacity: 0.8; }
          95% { opacity: 0.1; }
          97% { opacity: 0.9; }
        }
        @keyframes it-error-cursor {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        @keyframes it-scanline-move {
          from { background-position: 0 0; }
          to   { background-position: 0 100%; }
        }
      `}</style>

      <div
        className="fixed inset-0 z-[99999] overflow-hidden"
        style={{
          background: isBlackBg ? "#000" : "#000",
          animation: phase === "glitch" ? "it-flicker-bg 0.18s infinite" : "none",
          pointerEvents: "all",
        }}
      >

        {/* === ERROR PHASE === */}
        {phase === "error" && (
          <div className="absolute inset-0 flex flex-col items-start justify-center px-8 md:px-16"
            style={{ animation: "it-error-flicker 2s infinite" }}
          >
            {/* Scanlines */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: "repeating-linear-gradient(0deg, rgba(0,255,0,0.03) 0px, rgba(0,255,0,0.03) 1px, transparent 1px, transparent 4px)",
            }} />

            <div style={{ fontFamily: "'Share Tech Mono', monospace", position: "relative", zIndex: 10, width: "100%" }}>
              <div style={{ color: "rgba(0,255,0,0.4)", fontSize: "clamp(0.6rem, 1.5vw, 0.85rem)", letterSpacing: "0.2em", marginBottom: "1.5rem" }}>
                RELC.OS v4.2.1 · NODE STATUS MONITOR
              </div>

              <div style={{
                fontSize: "clamp(0.7rem, 2vw, 1rem)",
                color: "rgba(255,80,80,0.9)",
                letterSpacing: "0.1em",
                marginBottom: "0.5rem",
              }}>
                [CRITICAL] CONNECTION FAILURE
              </div>

              <div style={{
                fontSize: "clamp(1rem, 4vw, 2.4rem)",
                fontWeight: 900,
                color: "#ff3333",
                letterSpacing: "0.05em",
                textShadow: "0 0 20px #ff0000, 0 0 50px #ff000066",
                marginBottom: "1rem",
                lineHeight: 1.2,
              }}>
                LOST CONNECTION TO THE<br />
                RELC.OS SERVER NODE
              </div>

              <div style={{ color: "rgba(255,60,60,0.6)", fontSize: "clamp(0.55rem, 1.5vw, 0.75rem)", letterSpacing: "0.3em", marginBottom: "2rem" }}>
                ERR_NODE_UNREACHABLE · SOCKET_TIMEOUT · CODE 0x0000DEAD
              </div>

              <div style={{ color: "rgba(255,100,100,0.5)", fontSize: "clamp(0.5rem, 1.3vw, 0.7rem)", letterSpacing: "0.2em" }}>
                ATTEMPTING RECONNECT...
                <span style={{ animation: "it-error-cursor 0.8s infinite", marginLeft: "4px" }}>█</span>
              </div>
            </div>
          </div>
        )}

        {/* === GLITCH / DEEPFRY PHASE === */}
        {phase === "glitch" && (
          <>
            {/* Full-screen color flash */}
            {flashColor && (
              <div className="absolute inset-0 pointer-events-none" style={{
                background: flashColor,
                mixBlendMode: "screen",
                zIndex: 20,
              }} />
            )}

            {/* Main distorted layer */}
            <div
              className="absolute inset-0"
              style={{
                transform: `translate(${shakeOffset.x}px, ${shakeOffset.y}px) skewX(${shakeOffset.skew}deg) skewY(${shakeOffset.skewY}deg) scale(${shakeOffset.scale})`,
                filter: `saturate(${saturation}%) brightness(${brightness}%) hue-rotate(${hue}deg) contrast(${contrast}%)`,
                zIndex: 5,
              }}
            >
              {/* Deep fry orange layer */}
              <div className="absolute inset-0" style={{
                background: `rgba(255, 80, 0, ${0.2 + staticNoise * 0.5})`,
                mixBlendMode: "hard-light",
              }} />
              <div className="absolute inset-0" style={{
                background: `rgba(255, 255, 0, ${0.15 + staticNoise * 0.3})`,
                mixBlendMode: "overlay",
              }} />

              {/* Glitch bars */}
              {glitchBars.map((bar, i) => (
                <div
                  key={i}
                  className="absolute"
                  style={{
                    top: `${bar.top}%`,
                    left: 0,
                    width: `${bar.width}%`,
                    height: `${bar.height}px`,
                    background: bar.color,
                    opacity: bar.opacity,
                    mixBlendMode: i % 2 === 0 ? "screen" as const : "overlay" as const,
                    animation: `it-bar ${bar.duration}s ${bar.delay}s infinite`,
                    transform: `translateX(${bar.xOffset}px)`,
                  }}
                />
              ))}

              {/* Static noise dots */}
              {staticDots.map((dot, i) => (
                <div
                  key={i}
                  className="absolute"
                  style={{
                    top: `${dot.top}%`,
                    left: `${dot.left}%`,
                    width: `${dot.size}px`,
                    height: `${dot.size}px`,
                    background: i % 4 === 0 ? "#ff0000" : i % 4 === 1 ? "#ffff00" : i % 4 === 2 ? "#00ffff" : "#ffffff",
                    opacity: dot.opacity * (0.5 + staticNoise * 0.5),
                    animation: `it-static ${dot.duration}s infinite`,
                  }}
                />
              ))}

              {/* Scanlines */}
              <div className="absolute inset-0 pointer-events-none" style={{
                background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.35) 0px, rgba(0,0,0,0.35) 1px, transparent 1px, transparent 2px)",
              }} />
            </div>

            {/* Screen tearing — displaced horizontal slices */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 15 }}>
              <div className="absolute left-0 right-0" style={{
                top: `${tearOffset.top}%`,
                height: "18px",
                background: "rgba(0,0,0,0.85)",
                transform: `translateX(${tearOffset.shift1}px)`,
              }} />
              <div className="absolute left-0 right-0" style={{
                top: `${tearOffset.mid}%`,
                height: "12px",
                background: "rgba(0,0,0,0.7)",
                transform: `translateX(${tearOffset.shift2}px)`,
              }} />
              <div className="absolute left-0 right-0" style={{
                top: `${tearOffset.top * 1.6}%`,
                height: "8px",
                background: "rgba(0,255,255,0.15)",
                transform: `translateX(${tearOffset.shift3}px)`,
                mixBlendMode: "screen",
              }} />
            </div>

            {/* RGB chromatic split */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: "rgba(255,0,0,0.2)",
              transform: `translateX(${shakeOffset.x * 1.8}px)`,
              mixBlendMode: "screen",
              zIndex: 16,
            }} />
            <div className="absolute inset-0 pointer-events-none" style={{
              background: "rgba(0,255,255,0.15)",
              transform: `translateX(${-shakeOffset.x * 1.2}px)`,
              mixBlendMode: "screen",
              zIndex: 16,
            }} />

            {/* Center warning text */}
            {staticNoise > 0.5 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 18 }}>
                <span style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "clamp(1rem, 4vw, 2rem)",
                  fontWeight: 900,
                  color: staticNoise > 0.75 ? "#ffff00" : "#ff4400",
                  letterSpacing: "0.3em",
                  textShadow: `0 0 30px currentColor`,
                  opacity: staticNoise,
                  transform: `translateX(${shakeOffset.x * 2}px) skewX(${shakeOffset.skew * 0.5}deg)`,
                }}>
                  {staticNoise > 0.8 ? "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓" : "▓▓ CONNECTION LOST ▓▓"}
                </span>
              </div>
            )}
          </>
        )}

        {/* === WARNING PHASE (black screen + blue shield + text) === */}
        {(phase === "warning" || (phase === "border" && !warningVisible)) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-8">
            {/* Scanlines */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 1px, transparent 1px, transparent 4px)",
            }} />

            {/* Blue shield spinning vertically (rotateY) */}
            <div style={{
              animation: "it-shield-vertical 1.2s linear infinite, it-shield-pulse 1.5s ease-in-out infinite",
              position: "relative",
              zIndex: 10,
              perspective: "400px",
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
