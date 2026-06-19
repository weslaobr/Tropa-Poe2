import type { GGGItem, GGGCharacter } from '@/types/app'

export interface ComputedStats {
  life: number
  mana: number
  energyShield: number
  armour: number
  evasion: number
  strength: number
  dexterity: number
  intelligence: number
  resistFire: number
  resistCold: number
  resistLightning: number
  resistChaos: number
  blockChance: number
  spellDamage: number
  attackSpeed: number
  castSpeed: number
  movementSpeed: number
  rarity: number
  quantity: number

  weaponPhysicalDps: number
  weaponElementalDps: number
  weaponTotalDps: number
  weaponCritChance: number
  weaponAttacksPerSecond: number
  weaponAvgHit: number
}

function parseMod(mod: string): { stat: string; value: number } | null {
  const patterns: [RegExp, string][] = [
    [/\+(\d+)\s+to\s+maximum\s+Life/i, 'life'],
    [/\+(\d+)\s+to\s+maximum\s+Mana/i, 'mana'],
    [/\+(\d+)\s+to\s+maximum\s+Energy\s+Shield/i, 'energyShield'],
    [/\+(\d+)\s+to\s+Armour/i, 'armour'],
    [/\+(\d+)\s+to\s+Evasion\s+Rating/i, 'evasion'],
    [/\+(\d+)%\s+to\s+Fire\s+Resistance/i, 'resistFire'],
    [/\+(\d+)%\s+to\s+Cold\s+Resistance/i, 'resistCold'],
    [/\+(\d+)%\s+to\s+Lightning\s+Resistance/i, 'resistLightning'],
    [/\+(\d+)%\s+to\s+Chaos\s+Resistance/i, 'resistChaos'],
    [/\+(\d+)\s+to\s+Strength/i, 'strength'],
    [/\+(\d+)\s+to\s+Dexterity/i, 'dexterity'],
    [/\+(\d+)\s+to\s+Intelligence/i, 'intelligence'],
    [/(\d+)%\s+increased\s+Spell\s+Damage/i, 'spellDamage'],
    [/(\d+)%\s+increased\s+Attack\s+Speed/i, 'attackSpeed'],
    [/(\d+)%\s+increased\s+Cast\s+Speed/i, 'castSpeed'],
    [/(\d+)%\s+increased\s+Movement\s+Speed/i, 'movementSpeed'],
    [/(\d+)%\s+increased\s+Rarity\s+of\s+Items/i, 'rarity'],
    [/(\d+)%\s+increased\s+Quantity\s+of\s+Items/i, 'quantity'],
    [/\+(\d+)%\s+to\s+Block\s+Chance/i, 'blockChance'],
    [/(\d+)%\s+increased\s+Block\s+Chance/i, 'blockChance'],
  ]

  for (const [regex, stat] of patterns) {
    const m = mod.match(regex)
    if (m) return { stat, value: parseInt(m[1], 10) }
  }

  return null
}

function parseWeaponDamage(item: GGGItem): { physMin: number; physMax: number; eleDps: number; crit: number; aps: number } {
  let physMin = 0, physMax = 0, eleDps = 0, crit = 0, aps = 0

  for (const mod of [...(item.implicitMods ?? []), ...(item.explicitMods ?? [])]) {
    const phys = mod.match(/Adds\s+(\d+)\s+to\s+(\d+)\s+Physical\s+Damage/i)
    if (phys) { physMin += parseInt(phys[1], 10); physMax += parseInt(phys[2], 10); continue }

    const fire = mod.match(/Adds\s+(\d+)\s+to\s+(\d+)\s+Fire\s+Damage/i)
    if (fire) { eleDps += (parseInt(fire[1], 10) + parseInt(fire[2], 10)) / 2; continue }

    const cold = mod.match(/Adds\s+(\d+)\s+to\s+(\d+)\s+Cold\s+Damage/i)
    if (cold) { eleDps += (parseInt(cold[1], 10) + parseInt(cold[2], 10)) / 2; continue }

    const lightning = mod.match(/Adds\s+(\d+)\s+to\s+(\d+)\s+Lightning\s+Damage/i)
    if (lightning) { eleDps += (parseInt(lightning[1], 10) + parseInt(lightning[2], 10)) / 2; continue }

    const chaos = mod.match(/Adds\s+(\d+)\s+to\s+(\d+)\s+Chaos\s+Damage/i)
    if (chaos) { eleDps += (parseInt(chaos[1], 10) + parseInt(chaos[2], 10)) / 2; continue }

    const c = mod.match(/Critical\s+Strike\s+Chance:\s*([\d.]+)%/i)
    if (c) { crit = parseFloat(c[1]); continue }

    const a = mod.match(/Attacks\s+per\s+Second:\s*([\d.]+)/i)
    if (a) { aps = parseFloat(a[1]); continue }

    const a2 = mod.match(/(\d+(?:\.\d+)?)\s+Attacks\s+per\s+Second/i)
    if (a2) { aps = parseFloat(a2[1]); continue }

    const d = mod.match(/(\d+)-(\d+)\s+Physical\s+Damage/i)
    if (d) { physMin += parseInt(d[1], 10); physMax += parseInt(d[2], 10); continue }
  }

  return { physMin, physMax, eleDps, crit, aps }
}

export function computeStats(character: GGGCharacter): ComputedStats {
  const stats: ComputedStats = {
    life: 0, mana: 0, energyShield: 0,
    armour: 0, evasion: 0,
    strength: 0, dexterity: 0, intelligence: 0,
    resistFire: 0, resistCold: 0, resistLightning: 0, resistChaos: 0,
    blockChance: 0,
    spellDamage: 0, attackSpeed: 0, castSpeed: 0,
    movementSpeed: 0, rarity: 0, quantity: 0,
    weaponPhysicalDps: 0, weaponElementalDps: 0, weaponTotalDps: 0,
    weaponCritChance: 0, weaponAttacksPerSecond: 0, weaponAvgHit: 0,
  }

  const items = character.equipment ?? []

  for (const item of items) {
    const allMods = [...(item.implicitMods ?? []), ...(item.explicitMods ?? [])]

    for (const mod of allMods) {
      const parsed = parseMod(mod)
      if (parsed) {
        const key = parsed.stat as keyof ComputedStats
        if (key in stats && typeof stats[key] === 'number') {
          ;(stats as any)[key] += parsed.value
        }
      }
    }

    if (item.slot === 'Weapon' || item.slot === 'Offhand') {
      const wpn = parseWeaponDamage(item)
      if (wpn.aps > 0) {
        stats.weaponAttacksPerSecond = wpn.aps
        stats.weaponCritChance = wpn.crit
        const physAvg = (wpn.physMin + wpn.physMax) / 2
        stats.weaponPhysicalDps = physAvg * wpn.aps
        stats.weaponElementalDps = wpn.eleDps * wpn.aps
        stats.weaponTotalDps = stats.weaponPhysicalDps + stats.weaponElementalDps
        stats.weaponAvgHit = physAvg + wpn.eleDps
      }
    }
  }

  stats.life += 38 + character.level * 12
  stats.mana += 30 + character.level * 4

  return stats
}

export function formatNumber(n: number): string {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + 'k'
  return Math.round(n).toString()
}

export function formatPercent(n: number): string {
  return Math.round(n) + '%'
}

export function frameTypeLabel(frameType: number): string {
  switch (frameType) {
    case 0: return 'Normal'
    case 1: return 'Magic'
    case 2: return 'Rare'
    case 3: return 'Unique'
    case 4: return 'Gem'
    case 5: return 'Currency'
    default: return 'Normal'
  }
}

export function frameTypeColor(frameType: number): string {
  switch (frameType) {
    case 0: return 'text-poe-muted'
    case 1: return 'text-blue-400'
    case 2: return 'text-yellow-400'
    case 3: return 'text-orange-400'
    default: return 'text-poe-muted'
  }
}
