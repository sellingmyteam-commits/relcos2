import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useState, useEffect, useRef } from "react";
import Home from "@/pages/Home";
import Eaglercraft from "@/pages/Eaglercraft";
import Shellshockers from "@/pages/Shellshockers";
import GeometryDash from "@/pages/GeometryDash";
import MotoX3M from "@/pages/MotoX3M";
import StickmanMerge from "@/pages/StickmanMerge";
import Slope from "@/pages/Slope";
import FiveNightsAtWinstons from "@/pages/FiveNightsAtWinstons";
import RocketSoccer from "@/pages/RocketSoccer";
import RetroBowl from "@/pages/RetroBowl";
import DriftHunters from "@/pages/DriftHunters";
import BrawlStars from "@/pages/BrawlStars";
import BlockBlast from "@/pages/BlockBlast";
import BitLife from "@/pages/BitLife";
import EscapeRoad from "@/pages/EscapeRoad";
import SuperHot from "@/pages/SuperHot";
import CarKing from "@/pages/CarKing";
import DriftBoss from "@/pages/DriftBoss";
import Quake3 from "@/pages/Quake3";
import TombOfTheMask from "@/pages/TombOfTheMask";
import NaziZombies from "@/pages/NaziZombies";
import OneLoveLol from "@/pages/OneLoveLol";
import BikersRepublic from "@/pages/BikersRepublic";
import CounterStrike from "@/pages/CounterStrike";
import TenMinutesTillDawn from "@/pages/TenMinutesTillDawn";
import BabySniperVietnam from "@/pages/BabySniperVietnam";
import Chess from "@/pages/Chess";
import DriveMad from "@/pages/DriveMad";
import SnowballIO from "@/pages/SnowballIO";
import Chat from "@/pages/Chat";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/not-found";
import { SecurityBlock } from "@/components/SecurityBlock";
import { ChatUsernameOverlay } from "@/components/ChatUsernameOverlay";
import { BootLoader } from "@/components/BootLoader";
import { motion, AnimatePresence } from "framer-motion";
import { DmNotification } from "@/components/DmNotification";

function Router() {
  return (
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
      <Route path="/nazi-zombies" component={NaziZombies} />
      <Route path="/chat" component={Chat} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
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
          className="fixed top-20 right-4 z-[60] max-w-xs"
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
        <div className="mt-10 flex gap-2 justify-center opacity-20">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="w-1 h-8 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [securityFinished, setSecurityFinished] = useState(false);
  const [bootDone, setBootDone] = useState(false);
  const [username, setUsername] = useState(() => localStorage.getItem("chatUsername") || "");
  const [siteUserId, setSiteUserId] = useState<number | null>(() => {
    const stored = localStorage.getItem("siteUserId");
    return stored ? parseInt(stored, 10) : null;
  });
  const [banned, setBanned] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const allReady = securityFinished && bootDone && !!username;

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
      } catch {
      }
    };

    const ensureRegistered = async () => {
      if (siteUserId && siteUserId > 0) {
        await checkStatus(siteUserId);
        pollRef.current = setInterval(() => checkStatus(siteUserId), 5000);
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
          pollRef.current = setInterval(() => checkStatus(data.id), 5000);
        }
      } catch {
      }
    };

    ensureRegistered();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [username]);

  return (
    <QueryClientProvider client={queryClient}>
      <PanicButton />
      <SecurityBlock onComplete={() => setSecurityFinished(true)} />

      {securityFinished && !bootDone && (
        <BootLoader onComplete={() => setBootDone(true)} />
      )}

      {securityFinished && bootDone && !username && (
        <ChatUsernameOverlay onComplete={handleUsernameComplete} />
      )}

      {allReady && <WelcomeNotification />}
      {allReady && <DmNotification />}

      {banned && <BanWall />}

      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
