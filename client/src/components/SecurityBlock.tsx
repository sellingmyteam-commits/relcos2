import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import bitddImg from "@assets/bitdd_1770614807606.png";

export function SecurityBlock({ onComplete }: { onComplete?: () => void }) {
  const [clicks, setClicks] = useState(0);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    // Disable scrolling when locked
    if (!unlocked) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [unlocked]);

  const handleClick = () => {
    const nextClicks = clicks + 1;
    setClicks(nextClicks);
    if (nextClicks >= 5) {
      setUnlocked(true);
      if (onComplete) onComplete();
    }
  };

  return (
    <AnimatePresence>
      {!unlocked && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] bg-white flex items-center justify-center p-4 cursor-default"
          style={{ touchAction: "none" }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <div className="relative max-w-full max-h-full">
            <img 
              src={bitddImg} 
              alt="Security Block" 
              className="max-w-[100vw] md:max-w-[1200px] h-auto select-none pointer-events-none"
              draggable={false}
            />
            
            {/* Clickable Area for the Red X */}
            {/* Positioned based on the provided image structure */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleClick}
              className="absolute top-[12%] left-[33%] w-[4%] h-[10%] md:top-[12%] md:left-[33%] md:w-[4%] md:h-[10%] cursor-pointer flex items-center justify-center rounded-full"
              data-testid="button-unlock-x"
              title="Close"
            >
              {/* This div is invisible but captures clicks over the red X in the image */}
              <div className="w-full h-full" />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
