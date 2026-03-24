import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

interface AdUnitProps {
  slot: string;
  format?: "auto" | "horizontal" | "rectangle";
  className?: string;
}

export function AdUnit({ slot, format = "auto", className }: AdUnitProps) {
  const pushed = useRef(false);

  useEffect(() => {
    if (!slot || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch (e) {
      console.error("AdSense error:", e);
    }
  }, [slot]);

  if (!slot) {
    const heights: Record<string, string> = {
      horizontal: "h-[90px]",
      rectangle: "h-[250px]",
      auto: "h-[100px]",
    };
    return (
      <div
        className={cn(
          "w-full flex items-center justify-center rounded-lg border border-dashed border-cyan-500/30 bg-white/[0.02] backdrop-blur-sm",
          heights[format],
          className
        )}
      >
        <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-500/40 select-none">
          Ad
        </span>
      </div>
    );
  }

  return (
    <div className={cn("w-full overflow-hidden", className)}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-7010986673001515"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
