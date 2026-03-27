import { useState, useEffect, useRef } from "react";

export function SecurityBlock({ onComplete }: { onComplete?: () => void }) {
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!dismissed) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [dismissed]);

  useEffect(() => {
    const timer = setTimeout(() => setShowModal(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (showModal) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [showModal]);

  const handleEnter = () => {
    if (code === "2048") {
      setDismissed(true);
      document.body.style.overflow = "unset";
      if (onComplete) onComplete();
    } else {
      setError("Invalid Code");
      setCode("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleEnter();
  };

  if (dismissed) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-white overflow-y-auto"
      style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
    >
      {/* Navigation Bar */}
      <nav style={{
        backgroundColor: "#fff",
        borderBottom: "2px solid #111",
        padding: "0",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{
          maxWidth: "1100px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 24px",
        }}>
          <div style={{
            fontSize: "22px",
            fontWeight: "800",
            color: "#111",
            letterSpacing: "0.04em",
            fontFamily: "'Arial', sans-serif",
            textTransform: "uppercase",
          }}>
            Science Daily
          </div>
          <div style={{ display: "flex", gap: "32px" }}>
            {["Home", "News", "About", "Contact"].map((item) => (
              <a
                key={item}
                href="#"
                onClick={(e) => e.preventDefault()}
                style={{
                  color: "#111",
                  textDecoration: "none",
                  fontSize: "15px",
                  fontWeight: item === "News" ? "700" : "400",
                  fontFamily: "'Arial', sans-serif",
                  borderBottom: item === "News" ? "2px solid #111" : "2px solid transparent",
                  paddingBottom: "2px",
                  transition: "border-color 0.2s",
                }}
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* Article Content */}
      <main style={{ maxWidth: "740px", margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Category Tag */}
        <div style={{
          fontSize: "12px",
          fontWeight: "700",
          color: "#555",
          fontFamily: "'Arial', sans-serif",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: "14px",
          borderLeft: "3px solid #111",
          paddingLeft: "10px",
        }}>
          Science &amp; Technology
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: "clamp(28px, 5vw, 44px)",
          fontWeight: "700",
          color: "#111",
          lineHeight: "1.2",
          marginBottom: "16px",
          fontFamily: "'Georgia', serif",
          textTransform: "none",
        }}>
          Scientists Revisit Sulfur's Role in Rockets' Development
        </h1>

        {/* Byline */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          borderTop: "1px solid #ddd",
          borderBottom: "1px solid #ddd",
          padding: "12px 0",
          marginBottom: "32px",
          fontFamily: "'Arial', sans-serif",
          fontSize: "13px",
          color: "#666",
        }}>
          <span>By <strong style={{ color: "#111" }}>Science Daily Staff</strong></span>
          <span style={{ color: "#ccc" }}>|</span>
          <span>March 27, 2026</span>
          <span style={{ color: "#ccc" }}>|</span>
          <span>4 min read</span>
        </div>

        {/* Lead Paragraph */}
        <p style={{
          fontSize: "19px",
          lineHeight: "1.75",
          color: "#222",
          marginBottom: "28px",
          fontStyle: "italic",
          borderLeft: "4px solid #eee",
          paddingLeft: "20px",
        }}>
          Researchers and historians are taking a renewed interest in sulfur, a bright yellow element long known
          for its strong smell and flammability, as they explore its surprising connection to the origins of rocket technology.
        </p>

        {/* Sulfur Image */}
        <figure style={{ margin: "0 0 36px", textAlign: "center" }}>
          <img
            src="/sulfur.png"
            alt="Sulfur mineral specimen with bright yellow crystals"
            style={{
              width: "100%",
              maxWidth: "500px",
              height: "auto",
              borderRadius: "4px",
              display: "inline-block",
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            }}
          />
          <figcaption style={{
            fontSize: "13px",
            color: "#888",
            fontFamily: "'Arial', sans-serif",
            marginTop: "10px",
            fontStyle: "italic",
          }}>
            Native sulfur mineral, a key ingredient in black powder used in early rockets.
          </figcaption>
        </figure>

        <p style={{ fontSize: "17px", lineHeight: "1.8", color: "#333", marginBottom: "24px" }}>
          Sulfur, found naturally in mineral deposits around the world, has been used for centuries in chemical
          processes. Its most notable historical role comes from its inclusion in black powder, one of the earliest
          explosive mixtures ever created. Combined with charcoal and potassium nitrate, sulfur helps lower ignition
          temperature and improves the consistency of combustion.
        </p>

        {/* Section Heading */}
        <h2 style={{
          fontSize: "24px",
          fontWeight: "700",
          color: "#111",
          margin: "40px 0 16px",
          fontFamily: "'Georgia', serif",
          borderBottom: "2px solid #eee",
          paddingBottom: "10px",
        }}>
          From Ancient Explosives to Early Rockets
        </h2>

        <p style={{ fontSize: "17px", lineHeight: "1.8", color: "#333", marginBottom: "24px" }}>
          Historians trace the first rockets back over a thousand years to ancient China, where black powder was used
          not just for fireworks, but also for primitive rocket propulsion. When ignited, the mixture rapidly produces
          expanding gases, which escape from one end of a tube and generate thrust — pushing the device forward.
        </p>

        {/* Blockquote */}
        <blockquote style={{
          margin: "32px 0",
          padding: "20px 28px",
          background: "#f9f9f9",
          borderLeft: "5px solid #111",
          fontStyle: "italic",
          fontSize: "18px",
          color: "#333",
          lineHeight: "1.7",
        }}>
          "The chemistry is simple, but the impact was enormous. Sulfur played a key role in enabling controlled
          combustion, which is essential for any form of propulsion."
          <footer style={{
            marginTop: "10px",
            fontStyle: "normal",
            fontSize: "13px",
            fontFamily: "'Arial', sans-serif",
            color: "#777",
          }}>
            — Spokesperson, Modern Propulsion Research Institute
          </footer>
        </blockquote>

        {/* Section Heading */}
        <h2 style={{
          fontSize: "24px",
          fontWeight: "700",
          color: "#111",
          margin: "40px 0 16px",
          fontFamily: "'Georgia', serif",
          borderBottom: "2px solid #eee",
          paddingBottom: "10px",
        }}>
          The Science Behind the Reaction
        </h2>

        <p style={{ fontSize: "17px", lineHeight: "1.8", color: "#333", marginBottom: "16px" }}>
          When sulfur is part of a combustion mixture, it acts as a fuel enhancer:
        </p>

        <ul style={{
          margin: "0 0 24px 20px",
          padding: 0,
          fontSize: "17px",
          lineHeight: "2",
          color: "#333",
        }}>
          <li>It allows the mixture to ignite more easily</li>
          <li>It stabilizes the burn rate</li>
          <li>It contributes to the rapid release of gases</li>
        </ul>

        <p style={{ fontSize: "17px", lineHeight: "1.8", color: "#333", marginBottom: "24px" }}>
          This rapid gas expansion is what creates thrust, following the fundamental principle of motion described
          by Newton's Third Law: for every action, there is an equal and opposite reaction.
        </p>

        {/* Rocket Image */}
        <figure style={{ margin: "0 0 36px", textAlign: "center" }}>
          <img
            src="/rocket.webp"
            alt="Early rocket design inspired by black powder propulsion"
            style={{
              width: "100%",
              maxWidth: "380px",
              height: "auto",
              borderRadius: "4px",
              display: "inline-block",
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            }}
          />
          <figcaption style={{
            fontSize: "13px",
            color: "#888",
            fontFamily: "'Arial', sans-serif",
            marginTop: "10px",
            fontStyle: "italic",
          }}>
            Early rocket designs relied on black powder, in which sulfur was a key component.
          </figcaption>
        </figure>

        {/* Section Heading */}
        <h2 style={{
          fontSize: "24px",
          fontWeight: "700",
          color: "#111",
          margin: "40px 0 16px",
          fontFamily: "'Georgia', serif",
          borderBottom: "2px solid #eee",
          paddingBottom: "10px",
        }}>
          Modern Rocketry Moves Beyond Sulfur
        </h2>

        <p style={{ fontSize: "17px", lineHeight: "1.8", color: "#333", marginBottom: "24px" }}>
          Despite its importance in early developments, sulfur is no longer a primary component in modern rocket fuels.
          Today's space agencies and private companies rely on far more advanced propellants, such as liquid hydrogen
          and liquid oxygen or specialized solid fuels engineered for maximum efficiency and control.
        </p>

        <p style={{ fontSize: "17px", lineHeight: "1.8", color: "#333", marginBottom: "24px" }}>
          However, experts emphasize that sulfur's historical role should not be overlooked.
        </p>

        <blockquote style={{
          margin: "32px 0",
          padding: "20px 28px",
          background: "#f9f9f9",
          borderLeft: "5px solid #111",
          fontStyle: "italic",
          fontSize: "18px",
          color: "#333",
          lineHeight: "1.7",
        }}>
          "Without early discoveries involving sulfur-based mixtures, we might not have reached today's level
          of rocket technology."
          <footer style={{
            marginTop: "10px",
            fontStyle: "normal",
            fontSize: "13px",
            fontFamily: "'Arial', sans-serif",
            color: "#777",
          }}>
            — Researcher, Propulsion History Project
          </footer>
        </blockquote>

        {/* Section Heading */}
        <h2 style={{
          fontSize: "24px",
          fontWeight: "700",
          color: "#111",
          margin: "40px 0 16px",
          fontFamily: "'Georgia', serif",
          borderBottom: "2px solid #eee",
          paddingBottom: "10px",
        }}>
          A Lasting Legacy
        </h2>

        <p style={{ fontSize: "17px", lineHeight: "1.8", color: "#333", marginBottom: "24px" }}>
          While sulfur may no longer power rockets into space, its contribution to the evolution of propulsion
          remains significant. From ancient experimentation to modern engineering, this simple element helped lay
          the groundwork for one of humanity's greatest technological achievements.
        </p>

        <p style={{ fontSize: "17px", lineHeight: "1.8", color: "#333", marginBottom: "0" }}>
          As research continues, scientists are not only uncovering new applications for sulfur but also gaining
          a deeper appreciation for its place in the history of science and innovation.
        </p>

        {/* Footer Rule */}
        <hr style={{ margin: "48px 0 24px", border: "none", borderTop: "2px solid #eee" }} />
        <p style={{
          fontSize: "13px",
          color: "#aaa",
          fontFamily: "'Arial', sans-serif",
          textAlign: "center",
        }}>
          © 2026 Science Daily. All rights reserved.
        </p>
      </main>

      {/* Modal Overlay */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            backdropFilter: "blur(3px)",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "10px",
              padding: "40px 44px",
              width: "100%",
              maxWidth: "380px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
              textAlign: "center",
              fontFamily: "'Arial', sans-serif",
            }}
          >
            <h2 style={{
              fontSize: "22px",
              fontWeight: "800",
              color: "#111",
              margin: "0 0 8px",
              letterSpacing: "-0.01em",
            }}>
              Code Needed
            </h2>
            <p style={{ fontSize: "15px", color: "#555", margin: "0 0 24px" }}>
              Enter your access code
            </p>

            <input
              ref={inputRef}
              type="text"
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(""); }}
              onKeyDown={handleKeyDown}
              placeholder="Access code"
              data-testid="input-access-code"
              style={{
                width: "100%",
                padding: "11px 14px",
                fontSize: "16px",
                border: error ? "1.5px solid #e53e3e" : "1.5px solid #ccc",
                borderRadius: "6px",
                outline: "none",
                marginBottom: "8px",
                boxSizing: "border-box",
                textAlign: "center",
                letterSpacing: "0.1em",
                transition: "border-color 0.2s",
              }}
            />

            {error && (
              <p style={{
                fontSize: "13px",
                color: "#e53e3e",
                margin: "0 0 12px",
                fontWeight: "600",
              }}>
                {error}
              </p>
            )}

            <button
              onClick={handleEnter}
              data-testid="button-enter-code"
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "15px",
                fontWeight: "700",
                backgroundColor: "#111",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                marginTop: error ? "0" : "10px",
                letterSpacing: "0.05em",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#333")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#111")}
            >
              Enter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
