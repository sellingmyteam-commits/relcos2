import { useState, useEffect } from "react";
import { useDoor } from "@/components/DoorTransition";

export function SecurityBlock({ onComplete }: { onComplete?: () => void }) {
  const door = useDoor();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    document.body.style.overflow = dismissed ? "unset" : "hidden";
    return () => { document.body.style.overflow = "unset"; };
  }, [dismissed]);

  const grantAccess = () => {
    door.open("WELCOME", () => {
      setDismissed(true);
      document.body.style.overflow = "unset";
      onComplete?.();
    });
  };

  if (dismissed) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "relative", display: "inline-block", maxWidth: "460px", width: "55%", minHeight: "60px" }}>
        <img
          src="/bitdefender-block.png"
          alt=""
          draggable={false}
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            userSelect: "none",
            pointerEvents: "none",
          }}
        />
        <button
          onClick={grantAccess}
          aria-label="Continue to site"
          style={{
            position: "absolute",
            left: "4%",
            top: "14%",
            width: "17%",
            height: "40%",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 0,
            outline: "none",
          }}
        />
      </div>
    </div>
  );
}
