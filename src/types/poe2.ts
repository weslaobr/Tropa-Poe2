export interface BuildMetadata {
  className: string;
  ascendClassName: string | null;
  level: number | null;
  mainSocketGroup: number | null;
  bandit: string | null;
}

export interface PlayerStat {
  name: string;
  value: number;
}

export type ItemRarity = 'UNIQUE' | 'RARE' | 'MAGIC' | 'NORMAL' | 'GEM' | 'CURRENCY' | 'UNKNOWN';

export interface ParsedItem {
  id: string;
  itemClass: string | null;
  rarity: ItemRarity;
  name: string | null;
  base: string | null;
  itemLevel: number | null;
  mods: string[];
  rawText: string;
}

export interface ParsedGem {
  name: string;
  level: number | null;
  quality: number | null;
  enabled: boolean;
  isSupport: boolean;
}

export interface ParsedSkillGroup {
  label: string | null;
  enabled: boolean;
  gems: ParsedGem[];
}

export interface ParsedTree {
  spec: string | null;
  url: string | null;
}

export interface ParsedBuild {
  metadata: BuildMetadata;
  stats: PlayerStat[];
  items: ParsedItem[];
  slotById: Record<string, string>;
  skills: ParsedSkillGroup[];
  tree: ParsedTree | null;
}

export interface StoredBuild {
  id: string;
  code: string;
  importedAt: string;
  build: ParsedBuild;
}
