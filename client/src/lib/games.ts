import {
  MessageSquare, Skull, Zap, Users, Box, Bike, Crosshair, Circle, Target, Egg,
  Square, Sword, Cuboid, Cctv, Trophy, Goal, Car, Swords, Grid3x3, Heart, Route,
  Flame, Crown, Gauge, Bomb, Layers, Snowflake, Clock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type GameEntry = { href: string; label: string; icon: LucideIcon };

export const ALL_GAMES: GameEntry[] = [
  { href: "/1v1-lol", label: "1v1.lol", icon: Crosshair },
  { href: "/counter-strike", label: "Counter Strike", icon: Target },
  { href: "/bikers-republic", label: "Bikers Republic", icon: Skull },
  { href: "/10-minutes-till-dawn", label: "10 Min Till Dawn", icon: Clock },
  { href: "/baby-sniper-vietnam", label: "Baby Sniper Vietnam", icon: Sword },
  { href: "/chess", label: "Chess Classic", icon: Box },
  { href: "/drive-mad", label: "Drive Mad", icon: Square },
  { href: "/snowball-io", label: "Snowball.io", icon: Snowflake },
  { href: "/quake3", label: "Quake 3", icon: Bomb },
  { href: "/super-hot", label: "Super Hot", icon: Flame },
  { href: "/eaglercraft", label: "Eagler Craft X", icon: Cuboid },
  { href: "/shellshockers", label: "Shellshockers", icon: Egg },
  { href: "/geometry-dash", label: "Geometry Dash", icon: Zap },
  { href: "/motox3m", label: "Moto X3M", icon: Bike },
  { href: "/five-nights-at-winstons", label: "Five Nights At Winston's", icon: Cctv },
  { href: "/slope", label: "Slope", icon: Circle },
  { href: "/retro-bowl", label: "Retro Bowl", icon: Goal },
  { href: "/rocket-soccer", label: "Rocket Soccer", icon: Trophy },
  { href: "/drift-hunters", label: "Drift Hunters", icon: Car },
  { href: "/brawl-stars", label: "Brawl Stars", icon: Swords },
  { href: "/block-blast", label: "Block Blast", icon: Grid3x3 },
  { href: "/bitlife", label: "BitLife", icon: Heart },
  { href: "/escape-road", label: "Escape Road", icon: Route },
  { href: "/stickman-merge", label: "Stickman Merge", icon: Users },
  { href: "/car-king", label: "Car King", icon: Crown },
  { href: "/drift-boss", label: "Drift Boss", icon: Gauge },
  { href: "/tomb-of-the-mask", label: "Tomb of the Mask", icon: Layers },
  { href: "/chat", label: "Live Comms", icon: MessageSquare },
];

export function gameIdFromPath(path: string): string {
  return path.replace(/^\//, "").split("/")[0];
}
