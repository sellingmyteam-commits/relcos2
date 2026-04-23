export type GameEntry = { href: string; label: string };

export const ALL_GAMES: GameEntry[] = [
  { href: "/1v1-lol", label: "1v1.lol" },
  { href: "/counter-strike", label: "Counter Strike" },
  { href: "/bikers-republic", label: "Bikers Republic" },
  { href: "/10-minutes-till-dawn", label: "10 Min Till Dawn" },
  { href: "/baby-sniper-vietnam", label: "Baby Sniper Vietnam" },
  { href: "/chess", label: "Chess Classic" },
  { href: "/drive-mad", label: "Drive Mad" },
  { href: "/snowball-io", label: "Snowball.io" },
  { href: "/quake3", label: "Quake 3" },
  { href: "/super-hot", label: "Super Hot" },
  { href: "/eaglercraft", label: "Eagler Craft X" },
  { href: "/shellshockers", label: "Shellshockers" },
  { href: "/geometry-dash", label: "Geometry Dash" },
  { href: "/motox3m", label: "Moto X3M" },
  { href: "/five-nights-at-winstons", label: "Five Nights At Winston's" },
  { href: "/slope", label: "Slope" },
  { href: "/retro-bowl", label: "Retro Bowl" },
  { href: "/rocket-soccer", label: "Rocket Soccer" },
  { href: "/drift-hunters", label: "Drift Hunters" },
  { href: "/brawl-stars", label: "Brawl Stars" },
  { href: "/block-blast", label: "Block Blast" },
  { href: "/bitlife", label: "BitLife" },
  { href: "/escape-road", label: "Escape Road" },
  { href: "/stickman-merge", label: "Stickman Merge" },
  { href: "/car-king", label: "Car King" },
  { href: "/drift-boss", label: "Drift Boss" },
  { href: "/tomb-of-the-mask", label: "Tomb of the Mask" },
];

export function gameIdFromPath(path: string): string {
  return path.replace(/^\//, "").split("/")[0];
}
