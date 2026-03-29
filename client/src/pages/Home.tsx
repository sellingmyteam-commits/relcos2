import { Layout } from "@/components/Layout";
import { Link } from "wouter";
import { Gamepad2, MessageSquare, Skull, Zap, Users, Box, Bike, Crosshair, Circle, Target, Egg, Square, Sword, Cuboid, Cctv, Trophy, Goal, Car, Swords, Grid3x3, Heart, Route, Flame, Crown, Gauge, Bomb, Layers, User, Wifi, Mail, Snowflake, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useOnlineUsers } from "@/hooks/use-online-users";

export default function Home() {
  const [onlineCount, setOnlineCount] = useState(1);
  const username = localStorage.getItem("chatUsername") || "";
  const onlineUsers = useOnlineUsers();

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(protocol + "//" + window.location.host);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "online_count") {
          setOnlineCount(data.count);
        }
      } catch (e) {
        console.error("Failed to parse WS message", e);
      }
    };

    return () => ws.close();
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const games = [
    { href: "/1v1-lol", label: "1v1.lol", desc: "Build, edit and eliminate your opponents.", icon: Crosshair, color: "purple" },
    { href: "/counter-strike", label: "Counter Strike", desc: "Tactical FPS — eliminate the enemy team.", icon: Target, color: "pink" },
    { href: "/bikers-republic", label: "Bikers Republic", desc: "MX offroad bike racing madness.", icon: Skull, color: "primary" },
    { href: "/10-minutes-till-dawn", label: "10 Min Till Dawn", desc: "Survive waves of monsters until dawn.", icon: Clock, color: "purple" },
    { href: "/baby-sniper-vietnam", label: "Baby Sniper Vietnam", desc: "Tactical sniper action game.", icon: Sword, color: "pink" },
    { href: "/chess", label: "Chess Classic", desc: "The timeless game of strategy.", icon: Box, color: "primary" },
    { href: "/drive-mad", label: "Drive Mad", desc: "Crazy physics-based driving action.", icon: Square, color: "purple" },
    { href: "/snowball-io", label: "Snowball.io", desc: "Throw snowballs and knock out opponents.", icon: Snowflake, color: "pink" },
    { href: "/quake3", label: "Quake 3", desc: "Classic FPS arena combat.", icon: Bomb, color: "purple" },
    { href: "/super-hot", label: "Super Hot", desc: "Time moves only when you move.", icon: Flame, color: "pink" },
    { href: "/eaglercraft", label: "Eagler Craft X", desc: "Minecraft in your browser.", icon: Cuboid, color: "primary" },
    { href: "/shellshockers", label: "Shellshockers", desc: "The world's top egg-based shooter.", icon: Egg, color: "purple" },
    { href: "/geometry-dash", label: "Geometry Dash", desc: "Jump and fly your way through danger!", icon: Zap, color: "pink" },
    { href: "/motox3m", label: "Moto X3M", desc: "The best bike racing game.", icon: Bike, color: "primary" },
    { href: "/five-nights-at-winstons", label: "Five Nights At Winston's", desc: "Survive the night with Winston.", icon: Cctv, color: "purple" },
    { href: "/slope", label: "Slope", desc: "Roll down the slope as fast as you can.", icon: Circle, color: "pink" },
    { href: "/retro-bowl", label: "Retro Bowl", desc: "Classic retro football action.", icon: Goal, color: "primary" },
    { href: "/rocket-soccer", label: "Rocket Soccer", desc: "High-octane car soccer action.", icon: Trophy, color: "purple" },
    { href: "/drift-hunters", label: "Drift Hunters", desc: "3D car drifting on epic tracks.", icon: Car, color: "pink" },
    { href: "/brawl-stars", label: "Brawl Stars", desc: "Fast-paced multiplayer battles.", icon: Swords, color: "primary" },
    { href: "/block-blast", label: "Block Blast", desc: "Addictive block puzzle game.", icon: Grid3x3, color: "purple" },
    { href: "/bitlife", label: "BitLife", desc: "Live your best virtual life.", icon: Heart, color: "pink" },
    { href: "/escape-road", label: "Escape Road", desc: "Outrun the police at all costs.", icon: Route, color: "primary" },
    { href: "/stickman-merge", label: "Stickman Merge", desc: "Merge and fight with your army.", icon: Users, color: "purple" },
    { href: "/car-king", label: "Car King", desc: "Rule the arena in your car.", icon: Crown, color: "primary" },
    { href: "/drift-boss", label: "Drift Boss", desc: "Master the art of drifting.", icon: Gauge, color: "purple" },
    { href: "/tomb-of-the-mask", label: "Tomb of the Mask", desc: "Fast-paced arcade maze runner.", icon: Layers, color: "pink" },
    { href: "/nazi-zombies", label: "NZ: Portable", desc: "Survive endless waves of the undead.", icon: Skull, color: "purple" },
  ];

  return (
    <Layout>
      <div className="relative">
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-12 text-center pb-20 overflow-hidden">
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="relative max-w-4xl mx-auto"
          >
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-secondary to-accent opacity-20 blur-3xl" />
            
            <h1 className="relative text-5xl md:text-7xl lg:text-8xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 tracking-tighter leading-none mb-6">
              WELCOME BACK <span className="text-secondary">USER</span>
            </h1>
            
            <p className="relative text-xl md:text-3xl font-mono text-muted-foreground/80 max-w-2xl mx-auto leading-relaxed border-l-4 border-accent pl-6 py-2 bg-gradient-to-r from-accent/10 to-transparent rounded-r-lg">
              "You're meant to do your school work but we all know this is better."
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-48 mx-auto"
          >
            <div className="w-48 flex-shrink-0 bg-card/60 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
              <div className="px-4 py-3 border-b border-white/10 bg-green-500/5 flex items-center gap-2">
                <Wifi className="w-3.5 h-3.5 text-green-400" />
                <span className="text-[10px] font-display font-bold text-green-400 uppercase tracking-wider">Online</span>
                <span className="ml-auto text-[10px] font-mono text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded-full border border-green-500/20">
                  {onlineUsers.length}
                </span>
              </div>
              <div className="overflow-y-auto p-2 max-h-40">
                {onlineUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-muted-foreground/40 gap-2">
                    <Users className="w-5 h-5 opacity-20" />
                    <p className="text-[9px] font-mono text-center">No one online yet</p>
                  </div>
                ) : (
                  onlineUsers.map((user) => (
                    <div key={user} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors group">
                      <div className="relative flex-shrink-0">
                        <div className="w-5 h-5 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                          <User className="w-2.5 h-2.5 text-green-400" />
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-green-400 border border-card animate-pulse" />
                      </div>
                      <span className={cn("text-[10px] font-medium truncate flex-1", user === username ? "text-secondary" : "text-white")}>
                        {user === username ? `${user} (you)` : user}
                      </span>
                      {user !== username && (
                        <Link href={`/chat?dm=${encodeURIComponent(user)}`}>
                          <button
                            data-testid={`button-dm-${user}`}
                            title={`DM ${user}`}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-accent/10 border border-accent/20 text-accent hover:bg-accent/25 transition-colors"
                          >
                            <Mail className="w-2.5 h-2.5" />
                            DM
                          </button>
                        </Link>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>

          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl px-4"
          >
            {games.map(({ href, label, desc, icon: Icon, color }) => (
              <Link key={href} href={href}>
                <motion.div 
                  variants={item}
                  className={cn(
                    "glitch-card group cursor-pointer p-6 rounded-2xl bg-card/50 border border-white/5 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl",
                    color === "purple" 
                      ? "hover:shadow-purple-500/20 hover:bg-purple-500/10 hover:border-purple-500/50" 
                      : color === "pink"
                      ? "hover:shadow-pink-500/20 hover:bg-pink-500/10 hover:border-pink-500/50"
                      : "hover:shadow-secondary/20 hover:bg-secondary/10 hover:border-secondary/50"
                  )}
                >
                  <Icon className={cn(
                    "glitch-icon w-12 h-12 mb-4 mx-auto group-hover:scale-110 transition-transform",
                    color === "purple" ? "text-purple-500" : color === "pink" ? "text-pink-500" : "text-secondary"
                  )} />
                  <h3 className="text-xl font-bold text-white mb-2" data-testid={`text-game-${href.slice(1)}`}>{label}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </motion.div>
              </Link>
            ))}

            <Link href="/chat">
              <motion.div 
                variants={item}
                className="glitch-card group cursor-pointer p-6 rounded-2xl bg-card/50 border border-white/5 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-secondary/20 hover:bg-secondary/10 hover:border-secondary/50"
              >
                <MessageSquare className="glitch-icon w-12 h-12 text-secondary mb-4 mx-auto group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold text-white mb-2">Live Comms</h3>
                <p className="text-sm text-muted-foreground">Talk trash in real-time.</p>
              </motion.div>
            </Link>
          </motion.div>

          <div className="flex flex-col items-center gap-4 mt-8 pb-24">
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground/50">
              <Zap className="w-3 h-3" />
              <span>SYSTEM ONLINE • SECURE CONNECTION • READY TO PLAY</span>
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}
