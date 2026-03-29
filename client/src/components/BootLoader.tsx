import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const BOOT_LINES = [
  { text: "RELC.OS v2.4 — NETWORK GATEWAY INITIALIZING", type: "header", delay: 0 },
  { text: "Detecting school network environment...", type: "normal", delay: 700 },
  { text: "Network type: RESTRICTED (PROXY_DETECTED)", type: "warn", delay: 1500 },
  { text: "Bypassing school network block...", type: "normal", delay: 2300 },
  { text: "Spoofing DNS request to proxy.relcos.io...", type: "normal", delay: 3000 },
  { text: "School firewall bypassed ✓", type: "success", delay: 3900 },
  { text: "Connecting to RELC.OS private network...", type: "normal", delay: 4700 },
  { text: "Encryption handshake complete ✓", type: "success", delay: 5700 },
  { text: "Loading user database...", type: "normal", delay: 6500 },
  { text: "Fetching account credentials...", type: "normal", delay: 7200 },
  { text: "Verifying access permissions...", type: "normal", delay: 7900 },
  { text: "Access level: AUTHORIZED ✓", type: "success", delay: 8900 },
  { text: "Loading game catalog... 19 titles found", type: "normal", delay: 9600 },
  { text: "Initializing real-time chat systems...", type: "normal", delay: 10400 },
  { text: "All systems ready — Welcome to RELC.OS", type: "header", delay: 11400 },
];

const FADE_START = 12400;

export function BootLoader({ onComplete }: { onComplete: () => void }) {
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [progress, setProgress] = useState(0);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    BOOT_LINES.forEach((line, i) => {
      timers.push(setTimeout(() => {
        setVisibleLines((prev) => [...prev, i]);
      }, line.delay));
    });

    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setProgress(Math.min((elapsed / FADE_START) * 100, 100));
    }, 50);

    timers.push(setTimeout(() => {
      setOpacity(0);
    }, FADE_START));

    timers.push(setTimeout(() => {
      onComplete();
    }, FADE_START + 900));

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[500] flex flex-col items-center justify-center"
      style={{
        background: "hsl(240, 25%, 6%)",
        opacity,
        transition: "opacity 0.9s ease-in-out",
        pointerEvents: opacity < 0.5 ? "none" : "all",
      }}
    >
      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.07) 2px, rgba(0,0,0,0.07) 4px)",
        }}
      />

      {/* Ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, hsl(var(--secondary) / 0.12) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="relative w-full max-w-2xl px-6 flex flex-col gap-7">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div
            className="text-5xl font-display font-black tracking-widest uppercase mb-1.5"
            style={{
              color: "hsl(var(--secondary))",
              textShadow: "0 0 40px hsl(var(--secondary) / 0.45), 0 0 80px hsl(var(--secondary) / 0.2)",
            }}
          >
            RELC.OS
          </div>
          <div className="text-[10px] font-mono tracking-[0.4em] uppercase" style={{ color: "rgba(255,255,255,0.25)" }}>
            Private Network Gateway
          </div>
        </motion.div>

        {/* Terminal window */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(12px)" }}
        >
          {/* Titlebar */}
          <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}>
            <div className="w-3 h-3 rounded-full" style={{ background: "rgba(255,95,87,0.7)" }} />
            <div className="w-3 h-3 rounded-full" style={{ background: "rgba(255,189,46,0.7)" }} />
            <div className="w-3 h-3 rounded-full" style={{ background: "rgba(40,200,64,0.7)" }} />
            <span className="ml-2 text-[10px] font-mono tracking-widest" style={{ color: "rgba(255,255,255,0.25)" }}>
              relcos-boot — network_init.sh
            </span>
          </div>

          {/* Lines */}
          <div className="px-5 py-4 min-h-[240px] space-y-1.5 font-mono text-sm">
            {BOOT_LINES.map((line, i) => (
              <div
                key={i}
                className="flex items-start gap-2 leading-relaxed transition-all duration-300"
                style={{
                  opacity: visibleLines.includes(i) ? 1 : 0,
                  transform: visibleLines.includes(i) ? "translateX(0)" : "translateX(-6px)",
                }}
              >
                <span className="shrink-0 select-none text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.18)" }}>›</span>
                <span style={{
                  color: line.type === "header" ? "#ffffff"
                    : line.type === "success" ? "rgb(74, 222, 128)"
                    : line.type === "warn" ? "rgb(250, 204, 21)"
                    : "rgba(255,255,255,0.55)",
                  fontWeight: line.type === "header" ? "700" : "400",
                }}>
                  {line.text}
                  {visibleLines.length > 0 && i === visibleLines[visibleLines.length - 1] && visibleLines.length < BOOT_LINES.length && (
                    <span
                      className="ml-1 inline-block align-middle"
                      style={{
                        width: "8px",
                        height: "15px",
                        background: "currentColor",
                        animation: "pulse 0.8s ease-in-out infinite",
                      }}
                    />
                  )}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="space-y-2"
        >
          <div className="flex items-center justify-between text-[10px] font-mono tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.28)" }}>
            <span>Establishing connection</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, hsl(var(--secondary)), hsl(var(--accent)))",
                boxShadow: "0 0 12px hsl(var(--secondary) / 0.6)",
              }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
