/**
 * types/app.ts — Global application types
 *
 * Central type definitions shared across the entire app.
 * Game-specific names (gems, passives, items) are kept in English
 * to stay aligned with the GGG API and .build file format.
 */

// ── Character data returned by GGG API ─────────────────────────────────────
export interface GGGCharacter {
  name: string
  class: string        // e.g. "Ranger", "Witch"
  league: string       // e.g. "Standard", "Hardcore"
  level: number
  experience: number
  // Detailed data fetched on selection:
  equipment?: GGGItem[]
  passives?: PassiveNode[]
  gems?: ActiveGem[]
}

// ── GGG Item (equipment slot) ───────────────────────────────────────────────
export interface GGGItem {
  id: string
  name: string           // Raw English name from API — NOT translated
  typeLine: string       // e.g. "Ranger Quiver"
  slot: ItemSlot
  identified: boolean
  ilvl: number
  requirements?: { name: string; value: number }[]
  explicitMods?: string[]
  implicitMods?: string[]
  frameType?: number     // PoE item rarity frame type (0=Normal, 1=Magic, 2=Rare, 3=Unique, etc.)
}

export type ItemSlot =
  | 'Helm' | 'Amulet' | 'Chest' | 'Gloves' | 'Boots'
  | 'Ring' | 'Ring2' | 'Belt' | 'Weapon' | 'Offhand'
  | 'Flask' | 'Trinket'

// ── Gem / Active Skill ──────────────────────────────────────────────────────
export interface ActiveGem {
  id: string
  name: string       // English name — NOT translated
  level: number
  quality: number
  socketGroup: string  // e.g. "A", "B" (link group identifier)
  isSupport: boolean
}

// ── Passive Skill Tree Node ─────────────────────────────────────────────────
export interface PassiveNode {
  id: string
  name: string       // English — NOT translated
  allocated: boolean
  stats: string[]
}

// ── Character stat summary (derived from equipment + tree) ─────────────────
export interface CharacterStats {
  strength: number
  dexterity: number
  intelligence: number
  life: number
  mana: number
  energyShield: number
  resistFire: number
  resistCold: number
  resistLightning: number
  resistChaos: number
  dps?: number
}

// ── Parsed .build file ──────────────────────────────────────────────────────
export interface BuildFile {
  /** Version of the build planner format */
  version: string
  /** Target class */
  class: string
  /** Level milestones: breakpoints at which requirements change */
  levelMilestones: LevelMilestone[]
  /** All passive nodes planned */
  plannedPassives: PassiveNode[]
  /** All gem links planned */
  plannedGems: PlannedGemLink[]
  /** Target attribute stats */
  targetStats: CharacterStats
  /** Source file name for display */
  fileName: string
}

export interface LevelMilestone {
  level: number
  label: string  // e.g. "Early Game", "Mid Game", "Endgame"
  requiredPassives: string[]  // node IDs required by this level
  requiredGems: string[]      // gem names required by this level
}

export interface PlannedGemLink {
  groupLabel: string   // e.g. "Main Skill", "Aura Setup"
  gems: PlannedGem[]
}

export interface PlannedGem {
  name: string           // English name — NOT translated
  minLevel: number       // Minimum gem level recommended
  isSupport: boolean
  isRequired: boolean
}

// ── Global App State ────────────────────────────────────────────────────────
export interface AppState {
  isAuthenticated: boolean
  accessToken: string | null
  syncMode: 'oauth' | 'public' | 'mock'
  accountName: string | null
  selectedCharacter: GGGCharacter | null
  buildFile: BuildFile | null
  lastSyncAt: Date | null
  language: 'pt-BR' | 'en'
}

// ── Diff / Comparison result ────────────────────────────────────────────────
export interface BuildDiffResult {
  overallProgress: number             // 0–100 percentage
  passiveDiff: PassiveDiff
  gemDiff: GemDiff
  statDiff: StatDiff
}

export interface PassiveDiff {
  allocated: PassiveNode[]             // Nodes already allocated
  missing: PassiveNode[]               // Planned but not yet allocated
  nextRecommended: PassiveNode[]       // Next 3 nodes to allocate (priority)
  totalPlanned: number
  totalAllocated: number
}

export interface GemDiff {
  links: GemLinkDiff[]
}

export interface GemLinkDiff {
  groupLabel: string
  planned: PlannedGem[]
  current: ActiveGem[]
  missingGems: PlannedGem[]           // Gems in plan but not equipped
  correctGems: PlannedGem[]           // Gems present and at correct level
  underleveledGems: {
    planned: PlannedGem
    current: ActiveGem
    deficit: number                   // levels below recommended
  }[]
}

export interface StatDiff {
  current: CharacterStats
  target: CharacterStats
  delta: Partial<Record<keyof CharacterStats, number>>  // positive = surplus, negative = deficit
}
