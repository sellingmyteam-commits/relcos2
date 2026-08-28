import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { ChatUsernameOverlay } from "@/components/ChatUsernameOverlay";
import { motion, AnimatePresence } from "framer-motion";
import { GameLockGuard } from "@/components/GameLockGuard";
import { DoorProvider } from "@/components/DoorTransition";
import { ChatNotifications } from "@/components/ChatNotifications";
import { ITSequence } from "@/components/ITSequence";
import { reIdentifyUser } from "@/lib/socket";

const Home = lazy(() => import("@/pages/Home"));
const Eaglercraft = lazy(() => import("@/pages/Eaglercraft"));
const Shellshockers = lazy(() => import("@/pages/Shellshockers"));
const GeometryDash = lazy(() => import("@/pages/GeometryDash"));
const MotoX3M = lazy(() => import("@/pages/MotoX3M"));
const Slope = lazy(() => import("@/pages/Slope"));
const RetroBowl = lazy(() => import("@/pages/RetroBowl"));
const BrawlStars = lazy(() => import("@/pages/BrawlStars"));
const EscapeRoad = lazy(() => import("@/pages/EscapeRoad"));
const DriftBoss = lazy(() => import("@/pages/DriftBoss"));
const TombOfTheMask = lazy(() => import("@/pages/TombOfTheMask"));
const BikersRepublic = lazy(() => import("@/pages/BikersRepublic"));
const CounterStrike = lazy(() => import("@/pages/CounterStrike"));
const DriveMad = lazy(() => import("@/pages/DriveMad"));
const SnowballIO = lazy(() => import("@/pages/SnowballIO"));
const Pvz2Gardenless = lazy(() => import("@/pages/Pvz2Gardenless"));
const BasketballStars = lazy(() => import("@/pages/BasketballStars"));
const SubwaySurfersHouston = lazy(() => import("@/pages/SubwaySurfersHouston"));
const FireboyAndWatergirl = lazy(() => import("@/pages/FireboyAndWatergirl"));
const NzPortable = lazy(() => import("@/pages/NzPortable"));
const SolarSmash = lazy(() => import("@/pages/SolarSmash"));
const GunSpin = lazy(() => import("@/pages/GunSpin"));
const CookieClicker = lazy(() => import("@/pages/CookieClicker"));
const Recoil = lazy(() => import("@/pages/Recoil"));
const SnowRider = lazy(() => import("@/pages/SnowRider"));
const FiveNightsAtBigE = lazy(() => import("@/pages/FiveNightsAtBigE"));
const FiveNightsAtWinstons = lazy(() => import("@/pages/FiveNightsAtWinstons"));
const IdleMinerTycoon = lazy(() => import("@/pages/IdleMinerTycoon"));
const SkibidiShooter = lazy(() => import("@/pages/SkibidiShooter"));
const RussianBuckshot = lazy(() => import("@/pages/RussianBuckshot"));
const Chat = lazy(() => import("@/pages/Chat"));
const Admin = lazy(() => import("@/pages/Admin"));
const NotFound = lazy(() => import("@/pages/not-found"));

function PageLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-40">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-muted-foreground tracking-widest uppercase">Loading</span>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/eaglercraft" component={Eaglercraft} />
        <Route path="/shellshockers" component={Shellshockers} />
        <Route path="/geometry-dash" component={GeometryDash} />
        <Route path="/motox3m" component={MotoX3M} />
        <Route path="/slope" component={Slope} />
        <Route path="/bikers-republic" component={BikersRepublic} />
        <Route path="/counter-strike" component={CounterStrike} />
        <Route path="/drive-mad" component={DriveMad} />
        <Route path="/snowball-io" component={SnowballIO} />
        <Route path="/pvz2-gardenless" component={Pvz2Gardenless} />
        <Route path="/basketball-stars" component={BasketballStars} />
        <Route path="/subway-surfers-houston" component={SubwaySurfersHouston} />
        <Route path="/fireboy-and-watergirl" component={FireboyAndWatergirl} />
        <Route path="/nz-portable" component={NzPortable} />
        <Route path="/solar-smash" component={SolarSmash} />
        <Route path="/gun-spin" component={GunSpin} />
        <Route path="/cookie-clicker" component={CookieClicker} />
        <Route path="/retro-bowl" component={RetroBowl} />
        <Route path="/brawl-stars" component={BrawlStars} />
        <Route path="/escape-road" component={EscapeRoad} />
        <Route path="/drift-boss" component={DriftBoss} />
        <Route path="/tomb-of-the-mask" component={TombOfTheMask} />
        <Route path="/snow-rider" component={SnowRider} />
        <Route path="/recoil" component={Recoil} />
        <Route path="/five-nights-at-big-e" component={FiveNightsAtBigE} />
        <Route path="/five-nights-at-winstons" component={FiveNightsAtWinstons} />
        <Route path="/idle-miner-tycoon" component={IdleMinerTycoon} />
        <Route path="/skibidi-shooter" component={SkibidiShooter} />
        <Route path="/russian-buckshot" component={RussianBuckshot} />
        <Route path="/chat" component={Chat} />
        <Route path="/admin" component={Admin} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function PanicButton() {
  useEffect(() => {
    const handlePanic = (e: KeyboardEvent) => {
      const savedKey = localStorage.getItem("panicKey") || "`";
      if (e.key === savedKey) {
        e.preventDefault();
        window.open("https://simon.tcc.vic.edu.au/workdesk/", "_blank");
      }
    };
    window.addEventListener("keydown", handlePanic);
    return () => window.removeEventListener("keydown", handlePanic);
  }, []);
  return null;
}

function WelcomeNotification() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -40, x: 20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed top-4 right-4 z-[60] max-w-xs"
        >
          <div className="bg-card/95 backdrop-blur-xl border border-secondary/30 rounded-xl px-4 py-3 shadow-2xl shadow-secondary/10">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-display font-bold text-secondary uppercase tracking-wider">System</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">Access granted. Welcome back, user.</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function BanWall() {
  const [tick, setTick] = useState(0);
  const [lines, setLines] = useState<{ top: number; height: number; opacity: number; offset: number }[]>([]);
  const [chromaShift, setChromaShift] = useState({ x: 0, y: 0 });
  const [bodySkew, setBodySkew] = useState({ x: 0, y: 0, skew: 0 });
  const [flickerOut, setFlickerOut] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);

      if (Math.random() < 0.6) {
        const count = Math.floor(Math.random() * 5) + 1;
        setLines(Array.from({ length: count }, () => ({
          top: Math.random() * 100,
          height: Math.random() * 20 + 1,
          opacity: Math.random() * 0.55 + 0.05,
          offset: (Math.random() - 0.5) * 80,
        })));
      } else {
        setLines([]);
      }

      setChromaShift({
        x: (Math.random() - 0.5) * 10,
        y: (Math.random() - 0.5) * 4,
      });

      if (Math.random() < 0.4) {
        setBodySkew({
          x: (Math.random() - 0.5) * 14,
          y: (Math.random() - 0.5) * 6,
          skew: (Math.random() - 0.5) * 8,
        });
      } else {
        setBodySkew({ x: 0, y: 0, skew: 0 });
      }

      setFlickerOut(Math.random() < 0.07);
    }, 70);
    return () => clearInterval(interval);
  }, []);

  const vignette = "radial-gradient(ellipse at center, #1a0000 0%, #000 65%)";

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none overflow-hidden"
      style={{ background: vignette }}
      onContextMenu={e => e.preventDefault()}
    >
      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className="absolute w-full" style={{ top: `${(i / 30) * 100}%`, height: "1px", background: "rgba(255,0,0,0.06)" }} />
        ))}
      </div>

      {/* Glitch horizontal bars */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
        {lines.map((l, i) => (
          <div key={i} className="absolute w-full" style={{
            top: `${l.top}%`,
            height: `${l.height}px`,
            background: `rgba(255,0,40,${l.opacity})`,
            transform: `translateX(${l.offset}px)`,
            mixBlendMode: "screen",
          }} />
        ))}
      </div>

      {/* RGB split overlay */}
      {tick % 4 === 0 && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 3, background: `rgba(255,0,40,0.07)`, transform: `translate(${chromaShift.x * 2}px, ${chromaShift.y}px)`, mixBlendMode: "screen" }} />
      )}
      {tick % 4 === 1 && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 3, background: `rgba(0,255,249,0.05)`, transform: `translate(${-chromaShift.x}px, ${chromaShift.y * 0.5}px)`, mixBlendMode: "screen" }} />
      )}

      {/* Noise */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 4, opacity: tick % 3 === 0 ? 0.12 : 0.04, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")" }}
      />

      {/* Full-frame flicker */}
      {flickerOut && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 5, background: "rgba(255,0,30,0.18)" }} />
      )}

      {/* Main content */}
      <div
        className="relative text-center px-8 max-w-2xl"
        style={{
          zIndex: 10,
          transform: `translate(${bodySkew.x}px, ${bodySkew.y}px) skewX(${bodySkew.skew}deg)`,
          opacity: flickerOut ? 0.4 : 1,
          transition: "opacity 0.04s",
        }}
      >
        {/* Title with chroma split */}
        <div className="relative mb-3">
          <span className="absolute inset-0 flex items-center justify-center text-5xl sm:text-7xl font-black font-display tracking-[0.12em] uppercase pointer-events-none"
            style={{ color: "rgba(0,255,249,0.35)", transform: `translate(${chromaShift.x * 1.5}px, ${chromaShift.y}px)`, filter: "blur(1.5px)", WebkitTextStroke: "0px" }}>
            BANNED
          </span>
          <span className="absolute inset-0 flex items-center justify-center text-5xl sm:text-7xl font-black font-display tracking-[0.12em] uppercase pointer-events-none"
            style={{ color: "rgba(255,0,40,0.45)", transform: `translate(${-chromaShift.x}px, ${chromaShift.y * 0.5}px)`, filter: "blur(1px)" }}>
            BANNED
          </span>
          <motion.h1
            className="relative text-5xl sm:text-7xl font-black font-display tracking-[0.12em] uppercase"
            animate={{ opacity: [1, 0.7, 1, 0.85, 1] }}
            transition={{ duration: 0.35, repeat: Infinity, ease: "linear" }}
            style={{ color: "#ff0028", textShadow: "0 0 40px #ff002899, 0 0 80px #ff002855, 0 0 4px #fff, 0 0 120px #ff002833" }}
          >
            BANNED
          </motion.h1>
        </div>

        {/* Error code */}
        <motion.div
          className="text-[10px] font-mono tracking-[0.5em] uppercase mb-6"
          animate={{ opacity: [1, 0.1, 1, 0.6, 1, 0.3, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          style={{ color: "rgba(255,0,40,0.6)" }}
        >
          ERR_ACCESS_REVOKED // STATUS_0 // NODE_BLOCKED
        </motion.div>

        {/* Main message */}
        <div className="relative mb-3">
          <span className="absolute inset-0 flex items-center justify-center text-xl sm:text-2xl font-black font-display tracking-widest uppercase pointer-events-none"
            style={{ color: "rgba(0,255,249,0.2)", transform: `translate(${chromaShift.x}px, 0px)`, filter: "blur(1px)" }}>
            YOU HAVE BEEN BLOCKED FROM THIS SITE.
          </span>
          <h2
            className="relative text-xl sm:text-2xl font-black font-display tracking-widest uppercase"
            style={{ color: "#ff4455", textShadow: "0 0 20px #ff004488, 0 0 40px #ff002244" }}
          >
            YOU HAVE BEEN BLOCKED FROM THIS SITE.
          </h2>
        </div>

        {/* Sub message */}
        <motion.p
          className="text-base font-black font-mono tracking-[0.4em] uppercase"
          animate={{ opacity: [1, 0.2, 1, 0.5, 1, 0.8, 1] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.1 }}
          style={{ color: "#ff0028", textShadow: "0 0 15px #ff002888" }}
        >
          TOO BAD.
        </motion.p>

        {/* Corrupted data lines */}
        <div className="mt-8 space-y-1">
          {["SYS://ACCESS.DENIED", "RELC.OS >> TERMINATE_SESSION", "USR_STATUS: PERMANENTLY_BANNED"].map((line, i) => (
            <motion.div
              key={i}
              className="text-[9px] font-mono tracking-[0.3em]"
              animate={{ opacity: [0.15, 0.6, 0.15] }}
              transition={{ duration: 1.2 + i * 0.3, repeat: Infinity, delay: i * 0.4 }}
              style={{ color: `rgba(255,${i * 20},40,0.7)` }}
            >
              {line}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}


function App() {
  const [username, setUsername] = useState(() => localStorage.getItem("chatUsername") || "");
  const [isGuest, setIsGuest] = useState(() => localStorage.getItem("arua_guest") === "true");
  const [siteUserId, setSiteUserId] = useState<number | null>(() => {
    const stored = localStorage.getItem("siteUserId");
    return stored ? parseInt(stored, 10) : null;
  });
  const [banned, setBanned] = useState(false);

  const allReady = !!username;

  const handleUsernameComplete = (name: string, id: number) => {
    setUsername(name);
    if (id > 0) {
      setSiteUserId(id);
      localStorage.setItem("siteUserId", String(id));
      reIdentifyUser(id);
    }
  };

  const handleGuest = () => {
    localStorage.setItem("arua_guest", "true");
    setIsGuest(true);
  };

  useEffect(() => {
    if (!username) return;

    const checkStatus = async (uid: number) => {
      try {
        const res = await fetch(`/api/user/status/id/${uid}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === 0) {
          setBanned(true);
        } else {
          setBanned(false);
        }
        const currentUsername = localStorage.getItem("chatUsername");
        if (data.username && data.username !== currentUsername) {
          localStorage.setItem("chatUsername", data.username);
          setUsername(data.username);
        }
      } catch {}
    };

    const ensureRegistered = async () => {
      if (siteUserId && siteUserId > 0) {
        await checkStatus(siteUserId);
        return;
      }
      try {
        const res = await fetch("/api/user/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        });
        if (res.ok) {
          const data = await res.json();
          setSiteUserId(data.id);
          localStorage.setItem("siteUserId", String(data.id));
          reIdentifyUser(data.id);
          await checkStatus(data.id);
        }
      } catch {}
    };

    ensureRegistered();
  }, [username]);

  return (
    <QueryClientProvider client={queryClient}>
      <ChatNotifications currentUsername={username} />
      <ITSequence />
      <DoorProvider>
        <PanicButton />

        {!username && !isGuest && (
          <ChatUsernameOverlay onComplete={handleUsernameComplete} onGuest={handleGuest} />
        )}

        {allReady && <WelcomeNotification />}
        {allReady && <GameLockGuard />}

        {banned && <BanWall />}

        <Router />
        <Toaster />
      </DoorProvider>
    </QueryClientProvider>
  );
}

export default App;
