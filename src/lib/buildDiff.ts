/**
 * lib/buildDiff.ts — Build vs. Character Comparison Engine
 *
 * This is the core logic of SyncCompanion. Given the current character data
 * from the GGG API and the parsed .build file, it produces a structured
 * BuildDiffResult that drives the entire dashboard.
 *
 * IMPORTANT: All game-content strings (gem names, passive names, stat names)
 * are in English and must not be translated — they must match the API/build
 * file output exactly.
 */

import type {
  BuildFile,
  GGGCharacter,
  BuildDiffResult,
  PassiveDiff,
  GemDiff,
  GemLinkDiff,
  StatDiff,
  CharacterStats,
  PassiveNode,
  PlannedGem,
  ActiveGem,
} from '@/types/app'

// ── Passive Tree Diff ───────────────────────────────────────────────────────

/**
 * Compares planned passives vs. allocated passives.
 * Returns allocated nodes, missing nodes, and the next 3 recommended.
 */
export function diffPassives(
  build: BuildFile,
  character: GGGCharacter,
): PassiveDiff {
  const allocatedIds = new Set(
    (character.passives ?? []).filter(p => p.allocated).map(p => p.id),
  )

  const allocated: PassiveNode[] = build.plannedPassives.filter(n =>
    allocatedIds.has(n.id),
  )
  const missing: PassiveNode[] = build.plannedPassives.filter(
    n => !allocatedIds.has(n.id),
  )

  // Determine recommended order based on level milestones
  const currentLevel = character.level
  const relevantMilestone = [...build.levelMilestones]
    .reverse()
    .find(m => m.level <= currentLevel) ?? build.levelMilestones[0]

  // Priority: nodes from the current milestone that aren't allocated yet
  const milestoneIds = new Set(relevantMilestone?.requiredPassives ?? [])
  const priorityMissing = missing
    .filter(n => milestoneIds.has(n.id))
    .slice(0, 3)

  // Fill remaining slots from general missing list
  const nextRecommended =
    priorityMissing.length >= 3
      ? priorityMissing
      : [
          ...priorityMissing,
          ...missing.filter(n => !milestoneIds.has(n.id)).slice(
            0,
            3 - priorityMissing.length,
          ),
        ]

  return {
    allocated,
    missing,
    nextRecommended,
    totalPlanned:   build.plannedPassives.length,
    totalAllocated: allocated.length,
  }
}

// ── Gem Diff ────────────────────────────────────────────────────────────────

/**
 * Compares each planned gem link group vs. what the character has equipped.
 * Identifies missing gems and underleveled gems.
 */
export function diffGems(
  build: BuildFile,
  character: GGGCharacter,
): GemDiff {
  const equippedGems = character.gems ?? []

  // Build a lookup map: gem name (lowercase) → ActiveGem
  const equippedMap = new Map<string, ActiveGem>(
    equippedGems.map(g => [g.name.toLowerCase(), g]),
  )

  const links: GemLinkDiff[] = build.plannedGems.map(linkGroup => {
    const planned = linkGroup.gems
    const missingGems: PlannedGem[] = []
    const correctGems: PlannedGem[] = []
    const underleveledGems: GemLinkDiff['underleveledGems'] = []

    for (const plannedGem of planned) {
      const key = plannedGem.name.toLowerCase()
      const current = equippedMap.get(key)

      if (!current) {
        // Gem not present at all
        missingGems.push(plannedGem)
      } else if (current.level < plannedGem.minLevel) {
        // Gem present but below recommended level
        underleveledGems.push({
          planned: plannedGem,
          current,
          deficit: plannedGem.minLevel - current.level,
        })
      } else {
        correctGems.push(plannedGem)
      }
    }

    return {
      groupLabel: linkGroup.groupLabel,
      planned,
      current: planned
        .map(pg => equippedMap.get(pg.name.toLowerCase()))
        .filter(Boolean) as ActiveGem[],
      missingGems,
      correctGems,
      underleveledGems,
    }
  })

  return { links }
}

// ── Stat Diff ───────────────────────────────────────────────────────────────

/**
 * Derives current character stats from equipment and compares to build targets.
 * Delta is positive for surplus and negative for deficit.
 */
export function diffStats(
  build: BuildFile,
  character: GGGCharacter,
): StatDiff {
  // In a real implementation, stats are derived from the GGG character endpoint.
  // Here we use mock current stats — these would come from character.equipment analysis.
  const current: CharacterStats = deriveCurrentStats(character)
  const target  = build.targetStats

  const statKeys = Object.keys(target) as (keyof CharacterStats)[]
  const delta: StatDiff['delta'] = {}

  for (const key of statKeys) {
    const cur = current[key] ?? 0
    const tgt = target[key] ?? 0
    delta[key] = cur - tgt  // Positive = surplus, negative = deficit
  }

  return { current, target, delta }
}

/**
 * Derives current stats from the character object.
 * In production, these come from the /character endpoint's
 * "stats" object or are summed from equipment mods.
 */
function deriveCurrentStats(character: GGGCharacter): CharacterStats {
  // Placeholder values — replace with real stat parsing in production
  // This simulates a level-appropriate character with some gaps
  const baseByLevel = Math.floor(character.level / 10)

  return {
    strength:         40 + baseByLevel * 8,
    dexterity:        30 + baseByLevel * 6,
    intelligence:     25 + baseByLevel * 4,
    life:             120 + character.level * 12,
    mana:             80 + character.level * 5,
    energyShield:     0,
    resistFire:       30 + baseByLevel * 3,
    resistCold:       20 + baseByLevel * 2,
    resistLightning:  25 + baseByLevel * 2,
    resistChaos:      -60,  // Chaos res is typically negative until late game
    dps:              undefined,
  }
}

// ── Overall Progress ─────────────────────────────────────────────────────────

/**
 * Computes an overall 0–100 progress percentage across all tracked dimensions:
 *  - 50% weight on passives
 *  - 30% weight on gems
 *  - 20% weight on stats
 */
export function computeOverallProgress(diff: Omit<BuildDiffResult, 'overallProgress'>): number {
  // Passive progress: allocated / total
  const passiveScore =
    diff.passiveDiff.totalPlanned > 0
      ? diff.passiveDiff.totalAllocated / diff.passiveDiff.totalPlanned
      : 0

  // Gem progress: correct / total planned
  const totalGems = diff.gemDiff.links.reduce(
    (sum, l) => sum + l.planned.length, 0,
  )
  const correctGems = diff.gemDiff.links.reduce(
    (sum, l) => sum + l.correctGems.length, 0,
  )
  const gemScore = totalGems > 0 ? correctGems / totalGems : 0

  // Stat progress: count stats that meet or exceed target
  const statEntries = Object.entries(diff.statDiff.delta) as [keyof CharacterStats, number][]
  const metStats = statEntries.filter(([, delta]) => delta >= 0).length
  const statScore = statEntries.length > 0 ? metStats / statEntries.length : 0

  // Weighted average
  const overall = passiveScore * 0.5 + gemScore * 0.3 + statScore * 0.2

  return Math.round(overall * 100)
}

// ── Main entry point ─────────────────────────────────────────────────────────

/**
 * Runs the full build diff and returns a complete BuildDiffResult.
 *
 * @param build     Parsed .build file
 * @param character Current character data from GGG API
 */
export function runBuildDiff(
  build: BuildFile,
  character: GGGCharacter,
): BuildDiffResult {
  const passiveDiff = diffPassives(build, character)
  const gemDiff     = diffGems(build, character)
  const statDiff    = diffStats(build, character)

  const overallProgress = computeOverallProgress({
    passiveDiff,
    gemDiff,
    statDiff,
  })

  return {
    overallProgress,
    passiveDiff,
    gemDiff,
    statDiff,
  }
}
