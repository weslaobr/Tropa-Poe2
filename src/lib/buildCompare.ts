const ASCENDANCY_NAMES: Record<string, string> = {
  Witch2: 'Blood Mage', Witch1: 'Infernalist', Witch3: 'Stormweaver',
  Sorcerer1: 'Stormweaver', Sorcerer2: 'Chronomancer',
  Monk1: 'Invoker', Monk2: 'Acolyte of Chayula',
  Mercenary1: 'Witchhunter', Mercenary2: 'Gemlin Legionnaire', Mercenary3: 'Tactician',
  Warrior1: 'Warbringer', Warrior2: 'Titan', Warrior3: 'Smith of Kitava',
  Ranger1: 'Deadeye', Ranger2: 'Pathfinder',
  Huntress1: 'Ritualist', Huntress2: 'Amazon',
}

export interface PoeNinjaBuild {
  name: string
  author: string
  ascendancy: string
  ascendancyName: string
  passives: { id: string; weaponSet: number; category: string }[]
  passivesByCategory: Record<string, { id: string; weaponSet: number }[]>
  skills: { id: string; name: string; supports: { id: string; name: string }[] }[]
}

export interface BuildCompareResult {
  buildA: { name: string; ascendancy: string; author: string }
  buildB: { name: string; ascendancy: string; author: string }
  passives: {
    onlyA: { id: string; weaponSet: number }[]
    onlyB: { id: string; weaponSet: number }[]
    shared: { id: string; weaponSet: number }[]
  }
  passivesByCategory: Record<string, {
    onlyA: { id: string; weaponSet: number }[]
    onlyB: { id: string; weaponSet: number }[]
    shared: { id: string; weaponSet: number }[]
  }>
  skills: {
    onlyA: PoeNinjaBuild['skills']
    onlyB: PoeNinjaBuild['skills']
    shared: { name: string; id: string; supports: { onlyA: string[]; onlyB: string[]; shared: string[] } }[]
  }
  summary: {
    totalPassivesA: number; totalPassivesB: number
    sharedPassives: number; uniquePassivesA: number; uniquePassivesB: number
    totalSkillsA: number; totalSkillsB: number
    sharedSkills: number; uniqueSkillsA: number; uniqueSkillsB: number
  }
}

function categorizePassive(id: string): string {
  if (id.startsWith('Ascendancy')) return 'Ascendancy'
  if (id.startsWith('passive_keystone')) return 'Keystone'
  if (id.startsWith('jewel_slot')) return 'Jewel Socket'
  if (id.startsWith('witch_sorceress')) return 'Witch/Sorceress'
  if (id.startsWith('critical')) return 'Critical'
  if (id.startsWith('spell_critical')) return 'Spell Critical'
  if (id.startsWith('cast_speed')) return 'Cast Speed'
  if (id.startsWith('projectile_spell')) return 'Projectile Spell'
  if (id.startsWith('area_spell') || id.startsWith('area_attack') || id.startsWith('area_')) return 'Area'
  if (id.startsWith('spell')) return 'Spell'
  if (id.startsWith('elemental')) return 'Elemental'
  if (id.startsWith('energy_shield')) return 'Energy Shield'
  if (id.startsWith('intelligence')) return 'Intelligence'
  if (id.startsWith('dexterity')) return 'Dexterity'
  if (id.startsWith('strength')) return 'Strength'
  if (id.startsWith('attribute')) return 'Attributes'
  if (id.startsWith('duration')) return 'Duration'
  return 'Other'
}

function gemShortName(gemId: string): string {
  const m = gemId.match(/SkillGem([\w_]+)$/) || gemId.match(/SupportGem([\w_]+)$/) || gemId.match(/\/([\w_]+)$/)
  let name = m ? m[1] : gemId
  name = name.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ').replace(/ Two /g, ' 2 ').trim()
  return name
}

export function parsePoeNinjaBuild(rawJson: string, _fileName?: string): PoeNinjaBuild {
  const data = JSON.parse(rawJson)
  const build: PoeNinjaBuild = {
    name: data.name || 'Unnamed',
    author: data.author || 'Unknown',
    ascendancy: data.ascendancy || '',
    ascendancyName: ASCENDANCY_NAMES[data.ascendancy as string] || data.ascendancy || 'Unknown',
    passives: [],
    passivesByCategory: {},
    skills: [],
  }

  for (const p of data.passives || []) {
    const cat = categorizePassive(p.id)
    const entry = { id: p.id, weaponSet: p.weapon_set || 0, category: cat }
    build.passives.push(entry)
    ;(build.passivesByCategory[cat] ??= []).push(entry)
  }

  for (const s of data.skills || []) {
    build.skills.push({
      id: s.id,
      name: gemShortName(s.id),
      supports: (s.support_skills || []).map((ss: { id: string }) => ({
        id: ss.id,
        name: gemShortName(ss.id),
      })),
    })
  }

  return build
}

export function compareBuilds(a: PoeNinjaBuild, b: PoeNinjaBuild): BuildCompareResult {
  const diff: BuildCompareResult = {
    buildA: { name: a.name, ascendancy: a.ascendancyName, author: a.author },
    buildB: { name: b.name, ascendancy: b.ascendancyName, author: b.author },
    passives: { onlyA: [], onlyB: [], shared: [] },
    passivesByCategory: {},
    skills: { onlyA: [], onlyB: [], shared: [] },
    summary: {} as any,
  }

  const setA = new Set(a.passives.map(p => p.id))
  const setB = new Set(b.passives.map(p => p.id))

  for (const p of a.passives) {
    const target = setB.has(p.id) ? diff.passives.shared : diff.passives.onlyA
    target.push({ id: p.id, weaponSet: p.weaponSet })
  }
  for (const p of b.passives) {
    if (!setA.has(p.id)) diff.passives.onlyB.push({ id: p.id, weaponSet: p.weaponSet })
  }

  const cats = new Set([...Object.keys(a.passivesByCategory), ...Object.keys(b.passivesByCategory)])
  for (const cat of cats) {
    const ca = new Set((a.passivesByCategory[cat] || []).map(p => p.id))
    const cb = new Set((b.passivesByCategory[cat] || []).map(p => p.id))
    const section: { onlyA: { id: string; weaponSet: number }[]; onlyB: { id: string; weaponSet: number }[]; shared: { id: string; weaponSet: number }[] } = { onlyA: [], onlyB: [], shared: [] }
    for (const p of a.passivesByCategory[cat] || []) {
      ;(cb.has(p.id) ? section.shared : section.onlyA).push({ id: p.id, weaponSet: p.weaponSet })
    }
    for (const p of b.passivesByCategory[cat] || []) {
      if (!ca.has(p.id)) section.onlyB.push({ id: p.id, weaponSet: p.weaponSet })
    }
    diff.passivesByCategory[cat] = section
  }

  // Skills
  const keyA = new Map<string, PoeNinjaBuild['skills'][0]>()
  const keyB = new Map<string, PoeNinjaBuild['skills'][0]>()
  for (const s of a.skills) { const k = s.id.match(/\/([\w_]+)$/)?.[1] || s.id; keyA.set(k, s) }
  for (const s of b.skills) { const k = s.id.match(/\/([\w_]+)$/)?.[1] || s.id; keyB.set(k, s) }

  for (const s of a.skills) {
    const k = s.id.match(/\/([\w_]+)$/)?.[1] || s.id
    if (keyB.has(k)) {
      const other = keyB.get(k)!
      const shared = { name: s.name, id: s.id, supports: { onlyA: [] as string[], onlyB: [] as string[], shared: [] as string[] } }
      const supA = new Set(s.supports.map(ss => ss.id.match(/\/([\w_]+)$/)?.[1] || ss.id))
      const supB = new Set(other.supports.map(ss => ss.id.match(/\/([\w_]+)$/)?.[1] || ss.id))
      for (const ss of s.supports) {
        const sk = ss.id.match(/\/([\w_]+)$/)?.[1] || ss.id
        ;(supB.has(sk) ? shared.supports.shared : shared.supports.onlyA).push(ss.name)
      }
      for (const ss of other.supports) {
        const sk = ss.id.match(/\/([\w_]+)$/)?.[1] || ss.id
        if (!supA.has(sk)) shared.supports.onlyB.push(ss.name)
      }
      diff.skills.shared.push(shared)
    } else {
      diff.skills.onlyA.push(s)
    }
  }
  for (const s of b.skills) {
    const k = s.id.match(/\/([\w_]+)$/)?.[1] || s.id
    if (!keyA.has(k)) diff.skills.onlyB.push(s)
  }

  diff.summary = {
    totalPassivesA: a.passives.length, totalPassivesB: b.passives.length,
    sharedPassives: diff.passives.shared.length,
    uniquePassivesA: diff.passives.onlyA.length, uniquePassivesB: diff.passives.onlyB.length,
    totalSkillsA: a.skills.length, totalSkillsB: b.skills.length,
    sharedSkills: diff.skills.shared.length,
    uniqueSkillsA: diff.skills.onlyA.length, uniqueSkillsB: diff.skills.onlyB.length,
  }

  return diff
}
