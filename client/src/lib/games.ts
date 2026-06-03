import {
  MessageSquare, Skull, Zap, Users, Box, Bike, Crosshair, Circle, Target, Egg,
  Square, Sword, Cuboid, Cctv, Trophy, Goal, Car, Swords, Grid3x3, Heart, Route,
  Flame, Crown, Gauge, Bomb, Layers, Snowflake, Clock, Sprout, Dribbble, Train,
  Building2, Ghost, Rocket, Baseline, Bird, Telescope, Globe2, Sparkles, Star,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type GameEntry = { href: string; label: string; icon: LucideIcon };

export const ALL_GAMES: GameEntry[] = [
  { href: "/snow-rider", label: "Snow Rider 3D", icon: Snowflake },
  { href: "/recoil", label: "Recoil", icon: Zap },
  { href: "/fireboy-and-watergirl", label: "Fireboy and Watergirl", icon: Flame },
  { href: "/counter-strike", label: "Counter Strike", icon: Target },
  { href: "/bikers-republic", label: "Bikers Republic", icon: Skull },
  { href: "/drive-mad", label: "Drive Mad", icon: Square },
  { href: "/snowball-io", label: "Snowball.io", icon: Snowflake },
  { href: "/pvz2-gardenless", label: "PvZ2 Gardenless", icon: Sprout },
  { href: "/basketball-stars", label: "Basketball Stars", icon: Dribbble },
  { href: "/subway-surfers-houston", label: "Subway Surfers: Houston", icon: Train },
  { href: "/nz-portable", label: "COD Zombies", icon: Ghost },
  { href: "/solar-smash", label: "Solar Smash", icon: Globe2 },
  { href: "/eaglercraft", label: "Eagler Craft X", icon: Cuboid },
  { href: "/shellshockers", label: "Shellshockers", icon: Egg },
  { href: "/geometry-dash", label: "Geometry Dash", icon: Zap },
  { href: "/motox3m", label: "Moto X3M", icon: Bike },
  { href: "/slope", label: "Slope", icon: Circle },
  { href: "/retro-bowl", label: "Retro Bowl", icon: Goal },
  { href: "/brawl-stars", label: "Brawl Stars", icon: Swords },
  { href: "/escape-road", label: "Escape Road", icon: Route },
  { href: "/drift-boss", label: "Drift Boss", icon: Gauge },
  { href: "/tomb-of-the-mask", label: "Tomb of the Mask", icon: Layers },
  { href: "/cookie-clicker", label: "Cookie Clicker", icon: Star },
  { href: "/gun-spin", label: "Gun Spin", icon: Gauge },
  { href: "/chat", label: "Live Comms", icon: MessageSquare },
];

export function gameIdFromPath(path: string): string {
  return path.replace(/^\//, "").split("/")[0];
}
