export interface GameConfig {
  id: string;
  label: string;
  lsTerms?: string[];
  idbTerms?: string[];
}

export const GAME_LIST: GameConfig[] = [
  { id: "geometry-dash", label: "Geometry Dash", lsTerms: ["geometrydash", "geometry-dash", "geometry_dash", "gdash"] },
  { id: "shellshockers", label: "Shellshockers", lsTerms: ["shellshock", "shellshocker"] },
  { id: "eaglercraft", label: "Eaglercraft", lsTerms: ["eaglercraft", "eagler"], idbTerms: ["eaglercraft", "eagler"] },
  { id: "motox3m", label: "Moto X3M", lsTerms: ["motox3m", "moto-x3m", "moto_x3m", "motox"] },
  { id: "stickman-merge", label: "Stickman Merge", lsTerms: ["stickmanmerge", "stickman-merge", "stickman_merge", "stickman"] },
  { id: "slope", label: "Slope", lsTerms: ["slope"] },
  { id: "retro-bowl", label: "Retro Bowl", lsTerms: ["retrobowl", "retro-bowl", "retro_bowl"] },
  { id: "rocket-soccer", label: "Rocket Soccer", lsTerms: ["rocketsoccer", "rocket-soccer", "rocket_soccer"] },
  { id: "drift-hunters", label: "Drift Hunters", lsTerms: ["drifthunters", "drift-hunters", "drift_hunters", "drifthunter"], idbTerms: ["drifthunters", "drift"] },
  { id: "brawl-stars", label: "Brawl Stars", lsTerms: ["brawlstars", "brawl-stars", "brawl_stars", "brawl"], idbTerms: ["brawlstars", "brawl"] },
  { id: "block-blast", label: "Block Blast", lsTerms: ["blockblast", "block-blast", "block_blast"] },
  { id: "bitlife", label: "BitLife", lsTerms: ["bitlife", "bit-life"] },
  { id: "escape-road", label: "Escape Road", lsTerms: ["escaperoad", "escape-road", "escape_road"], idbTerms: ["escaperoad", "escape"] },
  { id: "super-hot", label: "SuperHot", lsTerms: ["superhot", "super-hot", "super_hot"] },
  { id: "five-nights-at-winstons", label: "Five Nights At Winston's", lsTerms: ["winstons", "fivenight", "fnaw"] },
  { id: "car-king", label: "Car King", lsTerms: ["carking", "car-king", "car_king"] },
  { id: "drift-boss", label: "Drift Boss", lsTerms: ["driftboss", "drift-boss", "drift_boss"] },
  { id: "quake3", label: "Quake 3", lsTerms: ["quake3", "quake-3", "quake_3", "quake"] },
  { id: "tomb-of-the-mask", label: "Tomb of the Mask", lsTerms: ["tombofthemask", "tomb-of-the-mask", "tomb_of_the_mask", "tombmask", "tomb"], idbTerms: ["tombofthemask", "tomb"] },
];

export function getGameConfig(id: string): GameConfig | undefined {
  return GAME_LIST.find((g) => g.id === id);
}
