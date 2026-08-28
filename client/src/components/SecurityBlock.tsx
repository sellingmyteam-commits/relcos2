import { useEffect } from "react";

export function SecurityBlock() {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "unset"; };
  }, []);

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
      </div>
    </div>
  );
}
