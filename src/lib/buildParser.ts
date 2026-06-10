/**
 * lib/buildParser.ts — .build File Parser
 *
 * Parses the JSON structure of a .build file (as exported from Path of Building
 * or similar tools) into the normalized BuildFile type used internally.
 *
 * NOTE: All game-content strings (gem names, passive names) are preserved
 * in English exactly as found in the file — no translation applied here.
 */

import type { BuildFile, PassiveNode, PlannedGemLink, CharacterStats, LevelMilestone } from '@/types/app'

// ── Schema of the raw .build JSON ────────────────────────────────────────────
// This represents the expected structure from Path of Building 2 export format.

interface RawBuildNode {
  id: string
  name: string
  stats?: string[]
}

interface RawGem {
  name: string
  minLevel?: number
  isSupport?: boolean
  required?: boolean
}

interface RawGemLink {
  label: string
  gems: RawGem[]
}

interface RawMilestone {
  level: number
  label: string
  passiveIds?: string[]
  gemNames?: string[]
}

interface RawBuildFile {
  version?: string
  class?: string
  nodes?: RawBuildNode[]
  gemLinks?: RawGemLink[]
  targetStats?: Partial<CharacterStats>
  milestones?: RawMilestone[]
}

// ── Parser ────────────────────────────────────────────────────────────────────

/**
 * Parses a raw .build JSON string into a normalized BuildFile object.
 * Throws a descriptive error if the format is invalid.
 */
export function parseBuildFile(raw: string, fileName: string): BuildFile {
  let data: RawBuildFile

  try {
    data = JSON.parse(raw) as RawBuildFile
  } catch {
    throw new Error(`Invalid .build file: not valid JSON. File: "${fileName}"`)
  }

  if (!data.nodes && !data.gemLinks) {
    throw new Error(
      `Invalid .build file: missing "nodes" and "gemLinks". File: "${fileName}"`,
    )
  }

  const plannedPassives: PassiveNode[] = (data.nodes ?? []).map(n => ({
    id:        n.id,
    name:      n.name,         // Kept in English — NOT translated
    allocated: false,          // Allocation state comes from the GGG API, not the build file
    stats:     n.stats ?? [],
  }))

  const plannedGems: PlannedGemLink[] = (data.gemLinks ?? []).map(link => ({
    groupLabel: link.label,    // English label (e.g. "Main Skill", "Aura Setup")
    gems: link.gems.map(g => ({
      name:       g.name,      // English gem name — NOT translated
      minLevel:   g.minLevel ?? 1,
      isSupport:  g.isSupport ?? false,
      isRequired: g.required  ?? true,
    })),
  }))

  const targetStats: CharacterStats = {
    strength:        data.targetStats?.strength        ?? 0,
    dexterity:       data.targetStats?.dexterity       ?? 0,
    intelligence:    data.targetStats?.intelligence    ?? 0,
    life:            data.targetStats?.life            ?? 0,
    mana:            data.targetStats?.mana            ?? 0,
    energyShield:    data.targetStats?.energyShield    ?? 0,
    resistFire:      data.targetStats?.resistFire      ?? 75,
    resistCold:      data.targetStats?.resistCold      ?? 75,
    resistLightning: data.targetStats?.resistLightning ?? 75,
    resistChaos:     data.targetStats?.resistChaos     ?? 0,
    dps:             data.targetStats?.dps,
  }

  const levelMilestones: LevelMilestone[] = (data.milestones ?? generateDefaultMilestones()).map(
    m => ({
      level:            m.level,
      label:            m.label,
      requiredPassives: m.passiveIds ?? [],
      requiredGems:     m.gemNames   ?? [],
    }),
  )

  return {
    version:          data.version ?? '1.0',
    class:            data.class   ?? 'Unknown',
    plannedPassives,
    plannedGems,
    targetStats,
    levelMilestones,
    fileName,
  }
}

/**
 * Generates sensible default level milestones when none are provided in the file.
 * Mirrors typical PoE 2 campaign/endgame level brackets.
 */
function generateDefaultMilestones(): RawMilestone[] {
  return [
    { level: 1,  label: 'Early Game', passiveIds: [], gemNames: [] },
    { level: 30, label: 'Mid Game',   passiveIds: [], gemNames: [] },
    { level: 60, label: 'Late Game',  passiveIds: [], gemNames: [] },
    { level: 80, label: 'Endgame',    passiveIds: [], gemNames: [] },
  ]
}
