import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { SecurityBlock } from "@/components/SecurityBlock";
import { ChatUsernameOverlay } from "@/components/ChatUsernameOverlay";
import { motion, AnimatePresence } from "framer-motion";
import { DmNotification } from "@/components/DmNotification";
import { GroupInviteNotification } from "@/components/GroupInviteNotification";
import { WarningModal } from "@/components/WarningModal";
import { GameLockGuard } from "@/components/GameLockGuard";
import { DoorProvider } from "@/components/DoorTransition";

const Home = lazy(() => import("@/pages/Home"));
const Eaglercraft = lazy(() => import("@/pages/Eaglercraft"));
const Shellshockers = lazy(() => import("@/pages/Shellshockers"));
const GeometryDash = lazy(() => import("@/pages/GeometryDash"));
const MotoX3M = lazy(() => import("@/pages/MotoX3M"));
const StickmanMerge = lazy(() => import("@/pages/StickmanMerge"));
const Slope = lazy(() => import("@/pages/Slope"));
const FiveNightsAtWinstons = lazy(() => import("@/pages/FiveNightsAtWinstons"));
const RocketSoccer = lazy(() => import("@/pages/RocketSoccer"));
const RetroBowl = lazy(() => import("@/pages/RetroBowl"));
const DriftHunters = lazy(() => import("@/pages/DriftHunters"));
const BrawlStars = lazy(() => import("@/pages/BrawlStars"));
const BlockBlast = lazy(() => import("@/pages/BlockBlast"));
const BitLife = lazy(() => import("@/pages/BitLife"));
const EscapeRoad = lazy(() => import("@/pages/EscapeRoad"));
const SuperHot = lazy(() => import("@/pages/SuperHot"));
const CarKing = lazy(() => import("@/pages/CarKing"));
const DriftBoss = lazy(() => import("@/pages/DriftBoss"));
const Quake3 = lazy(() => import("@/pages/Quake3"));
const TombOfTheMask = lazy(() => import("@/pages/TombOfTheMask"));
const OneLoveLol = lazy(() => import("@/pages/OneLoveLol"));
const BikersRepublic = lazy(() => import("@/pages/BikersRepublic"));
const CounterStrike = lazy(() => import("@/pages/CounterStrike"));
const TenMinutesTillDawn = lazy(() => import("@/pages/TenMinutesTillDawn"));
const BabySniperVietnam = lazy(() => import("@/pages/BabySniperVietnam"));
const Chess = lazy(() => import("@/pages/Chess"));
const DriveMad = lazy(() => import("@/pages/DriveMad"));
const SnowballIO = lazy(() => import("@/pages/SnowballIO"));
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
        <Route path="/stickman-merge" component={StickmanMerge} />
        <Route path="/slope" component={Slope} />
        <Route path="/1v1-lol" component={OneLoveLol} />
        <Route path="/bikers-republic" component={BikersRepublic} />
        <Route path="/counter-strike" component={CounterStrike} />
        <Route path="/10-minutes-till-dawn" component={TenMinutesTillDawn} />
        <Route path="/baby-sniper-vietnam" component={BabySniperVietnam} />
        <Route path="/chess" component={Chess} />
        <Route path="/drive-mad" component={DriveMad} />
        <Route path="/snowball-io" component={SnowballIO} />
        <Route path="/five-nights-at-winstons" component={FiveNightsAtWinstons} />
        <Route path="/rocket-soccer" component={RocketSoccer} />
        <Route path="/retro-bowl" component={RetroBowl} />
        <Route path="/drift-hunters" component={DriftHunters} />
        <Route path="/brawl-stars" component={BrawlStars} />
        <Route path="/block-blast" component={BlockBlast} />
        <Route path="/bitlife" component={BitLife} />
        <Route path="/escape-road" component={EscapeRoad} />
        <Route path="/super-hot" component={SuperHot} />
        <Route path="/car-king" component={CarKing} />
        <Route path="/drift-boss" component={DriftBoss} />
        <Route path="/quake3" component={Quake3} />
        <Route path="/tomb-of-the-mask" component={TombOfTheMask} />
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
  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black select-none"
      style={{ background: "radial-gradient(ellipse at center, #1a0000 0%, #000000 70%)" }}
      onContextMenu={e => e.preventDefault()}
    >
      <div className="text-center px-8 max-w-xl">
        <div
          className="text-7xl font-black tracking-widest text-red-500 mb-6 font-mono"
          style={{ textShadow: "0 0 40px rgba(255,0,0,0.8), 0 0 80px rgba(255,0,0,0.4)" }}
        >
          ⛔
        </div>
        <h1
          className="text-3xl sm:text-4xl font-black tracking-widest uppercase text-red-400 mb-4 font-mono leading-tight"
          style={{ textShadow: "0 0 30px rgba(255,50,50,0.7)" }}
        >
          YOU HAVE BEEN BLOCKED FROM THIS SITE.
        </h1>
        <p
          className="text-xl font-bold tracking-widest uppercase text-red-600 font-mono"
          style={{ textShadow: "0 0 20px rgba(255,0,0,0.5)" }}
        >
          TOO BAD.
        </p>
      </div>
    </div>
  );
}

function App() {
  const [securityFinished, setSecurityFinished] = useState(false);
  const [username, setUsername] = useState(() => localStorage.getItem("chatUsername") || "");
  const [siteUserId, setSiteUserId] = useState<number | null>(() => {
    const stored = localStorage.getItem("siteUserId");
    return stored ? parseInt(stored, 10) : null;
  });
  const [banned, setBanned] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const allReady = securityFinished && !!username;

  const handleUsernameComplete = (name: string, id: number) => {
    setUsername(name);
    if (id > 0) {
      setSiteUserId(id);
      localStorage.setItem("siteUserId", String(id));
    }
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
        pollRef.current = setInterval(() => checkStatus(siteUserId), 10000);
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
          await checkStatus(data.id);
          pollRef.current = setInterval(() => checkStatus(data.id), 10000);
        }
      } catch {}
    };

    ensureRegistered();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [username]);

  return (
    <QueryClientProvider client={queryClient}>
      <DoorProvider>
        <PanicButton />
        <SecurityBlock onComplete={() => setSecurityFinished(true)} />

        {securityFinished && !username && (
          <ChatUsernameOverlay onComplete={handleUsernameComplete} />
        )}

        {allReady && <WelcomeNotification />}
        {allReady && <DmNotification />}
        {allReady && <GroupInviteNotification />}
        {allReady && <WarningModal />}
        {allReady && <GameLockGuard />}

        {banned && <BanWall />}

        <Router />
        <Toaster />
      </DoorProvider>
    </QueryClientProvider>
  );
}

export default App;
