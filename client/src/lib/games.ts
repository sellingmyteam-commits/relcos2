import {
  MessageSquare, Skull, Zap, Users, Box, Bike, Crosshair, Circle, Target, Egg,
  Square, Sword, Cuboid, Cctv, Trophy, Goal, Car, Swords, Grid3x3, Heart, Route,
  Flame, Crown, Gauge, Bomb, Layers, Snowflake, Clock, Sprout, Dribbble, Train,
  Building2, Ghost, Rocket, Baseline, Bird, Telescope, Globe2, Sparkles, Star,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type GameEntry = { href: string; label: string; icon: LucideIcon };

export const ALL_GAMES: GameEntry[] = [
  { href: "/fireboy-and-watergirl", label: "Fireboy and Watergirl", icon: Flame },
  { href: "/1v1-lol", label: "1v1.lol", icon: Crosshair },
  { href: "/counter-strike", label: "Counter Strike", icon: Target },
  { href: "/bikers-republic", label: "Bikers Republic", icon: Skull },
  { href: "/10-minutes-till-dawn", label: "10 Min Till Dawn", icon: Clock },
  { href: "/drive-mad", label: "Drive Mad", icon: Square },
  { href: "/snowball-io", label: "Snowball.io", icon: Snowflake },
  { href: "/pixel-shooter", label: "Pixel Shooter", icon: Crosshair },
  { href: "/pvz2-gardenless", label: "PvZ2 Gardenless", icon: Sprout },
  { href: "/basketball-stars", label: "Basketball Stars", icon: Dribbble },
  { href: "/subway-surfers-houston", label: "Subway Surfers: Houston", icon: Train },
  { href: "/russian-buckshot", label: "Russian Buckshot", icon: Bomb },
  { href: "/nz-portable", label: "COD Zombies", icon: Ghost },
  { href: "/jetpack-joyride", label: "Jetpack Joyride", icon: Rocket },
  { href: "/angry-birds", label: "Angry Birds", icon: Bird },
  { href: "/solar-smash", label: "Solar Smash", icon: Globe2 },
  { href: "/skibidi-shooter", label: "Skibidi Shooter", icon: Sparkles },
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
  { href: "/drift-boss", label: "Drift Boss", icon: Gauge },
  { href: "/tomb-of-the-mask", label: "Tomb of the Mask", icon: Layers },
  { href: "/cookie-clicker", label: "Cookie Clicker", icon: Star },
  { href: "/hole-io", label: "Hole.io", icon: Circle },
  { href: "/bowmasters", label: "Bowmasters", icon: Target },
  { href: "/gun-spin", label: "Gun Spin", icon: Gauge },
  { href: "/idle-miner-tycoon", label: "Idle Miner Tycoon", icon: Layers },
  { href: "/chat", label: "Live Comms", icon: MessageSquare },
];

export function gameIdFromPath(path: string): string {
  return path.replace(/^\//, "").split("/")[0];
}
