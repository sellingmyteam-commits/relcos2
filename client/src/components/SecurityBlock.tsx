import { useState, useEffect, useRef } from "react";
import { useDoor } from "@/components/DoorTransition";

export function SecurityBlock({ onComplete }: { onComplete?: () => void }) {
  const door = useDoor();
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [echoAttempts, setEchoAttempts] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.style.overflow = dismissed ? "unset" : "hidden";
    return () => { document.body.style.overflow = "unset"; };
  }, [dismissed]);

  useEffect(() => {
    if (showModal) setTimeout(() => inputRef.current?.focus(), 50);
  }, [showModal]);

  const grantAccess = () => {
    door.open("WELCOME", () => {
      setDismissed(true);
      document.body.style.overflow = "unset";
      onComplete?.();
    });
  };

  const handleXClick = () => {
    const next = clickCount + 1;
    setClickCount(next);
    if (next >= 5) {
      setClickCount(0);
      const isUnlocked = localStorage.getItem("arua_unlocked") === "true";
      if (isUnlocked) {
        grantAccess();
      } else {
        setShowModal(true);
      }
    }
  };

  const handleEnter = () => {
    const trimmed = code.trim().toLowerCase();
    if (trimmed !== "echo") {
      setError("Invalid code.");
      setCode("");
      return;
    }
    // Correct code "echo"
    if (echoAttempts === 0) {
      // First time — say wrong, remember attempt
      setError("Wrong code.");
      setCode("");
      setEchoAttempts(1);
    } else {
      // Second time — grant access and remember
      localStorage.setItem("arua_unlocked", "true");
      setShowModal(false);
      setError("");
      setCode("");
      grantAccess();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleEnter();
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
      {/* Image with invisible X button overlaid */}
      <div style={{ position: "relative", display: "inline-block", maxWidth: "700px", width: "90%", minHeight: "80px" }}>
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
        {/* Invisible button covering the red X circle (~6–19% from left, ~14–51% from top) */}
        <button
          onClick={handleXClick}
          aria-hidden="true"
          tabIndex={-1}
          style={{
            position: "absolute",
            left: "4%",
            top: "12%",
            width: "16%",
            height: "42%",
            background: "transparent",
            border: "none",
            cursor: "default",
            padding: 0,
            outline: "none",
          }}
        />
      </div>

      {/* Access code modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "10px",
              padding: "40px 44px",
              width: "100%",
              maxWidth: "360px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
              textAlign: "center",
              fontFamily: "'Arial', sans-serif",
            }}
          >
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "800",
                color: "#111",
                margin: "0 0 8px",
              }}
            >
              Access Code Required
            </h2>
            <p style={{ fontSize: "14px", color: "#666", margin: "0 0 22px" }}>
              Enter your access code to continue.
            </p>

            <input
              ref={inputRef}
              type="password"
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(""); }}
              onKeyDown={handleKeyDown}
              placeholder="Access code"
              autoComplete="off"
              style={{
                width: "100%",
                padding: "10px 14px",
                fontSize: "16px",
                color: "#111",
                border: error ? "1.5px solid #e53e3e" : "1.5px solid #ccc",
                borderRadius: "6px",
                outline: "none",
                marginBottom: "8px",
                boxSizing: "border-box",
                textAlign: "center",
                letterSpacing: "0.15em",
                background: "#fff",
              }}
            />

            {error && (
              <p
                style={{
                  fontSize: "13px",
                  color: "#e53e3e",
                  margin: "0 0 10px",
                  fontWeight: "600",
                }}
              >
                {error}
              </p>
            )}

            <button
              onClick={handleEnter}
              style={{
                width: "100%",
                padding: "11px",
                fontSize: "14px",
                fontWeight: "700",
                backgroundColor: "#cc0000",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                marginTop: error ? "0" : "8px",
                letterSpacing: "0.05em",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#aa0000")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#cc0000")}
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
