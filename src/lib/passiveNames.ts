const KEYSTONE_NAMES: Record<string, string> = {
  'passive_keystone_elemental_equilibrium': 'Elemental Equilibrium',
  'passive_keystone_blood_magic': 'Blood Magic',
  'passive_keystone_chaos_inoculation': 'Chaos Inoculation',
  'passive_keystone_eldritch_battery': 'Eldritch Battery',
  'passive_keystone_ghost_reaver': 'Ghost Reaver',
  'passive_keystone_iron_grip': 'Iron Grip',
  'passive_keystone_iron_reflexes': 'Iron Reflexes',
  'passive_keystone_iron_will': 'Iron Will',
  'passive_keystone_minion_instability': 'Minion Instability',
  'passive_keystone_necrotic_aegis': 'Necrotic Aegis',
  'passive_keystone_nullification': 'Nullification',
  'passive_keystone_pain_attunement': 'Pain Attunement',
  'passive_keystone_point_blank': 'Point Blank',
  'passive_keystone_resolute_technique': 'Resolute Technique',
  'passive_keystone_unwavering_stance': 'Unwavering Stance',
  'passive_keystone_vaal_pact': 'Vaal Pact',
  'passive_keystone_zealots_oath': "Zealot's Oath",
  'passive_keystone_eldritch_overcharge': 'Eldritch Overcharge',
}

const CATEGORY_DISPLAY: Record<string, string> = {
  crit: 'Critical Strike',
  criticals: 'Critical Strike',
  critical: 'Critical Strike',
  spell_criticals: 'Spell Critical Strike',
  spell_critical: 'Spell Critical Strike',
  spell_crit: 'Spell Critical Strike',
  intelligence: 'Intelligence',
  dexterity: 'Dexterity',
  strength: 'Strength',
  energy_shield: 'Energy Shield',
  es: 'Energy Shield',
  cast_speed: 'Cast Speed',
  elemental: 'Elemental Damage',
  spell: 'Spell Damage',
  spells: 'Spell Damage',
  projectile_spells: 'Projectile Spell Damage',
  projectile: 'Projectile Damage',
  area_spells: 'Area Spell Damage',
  area_attacks: 'Area Attack Damage',
  area: 'Area Damage',
  duration: 'Skill Duration',
  attributes: 'Attributes',
  attribute: 'Attributes',
  witch_sorceress: 'Witch / Sorceress',
  jewel_slot: 'Jewel Socket',
  ascendancy: 'Ascendancy',
  passive_keystone: 'Keystone',
  life: 'Maximum Life',
  mana: 'Maximum Mana',
  armour: 'Armour',
  evasion: 'Evasion',
  block: 'Block',
  attack: 'Attack Damage',
  attacks: 'Attack Damage',
  fire: 'Fire Damage',
  cold: 'Cold Damage',
  lightning: 'Lightning Damage',
  chaos: 'Chaos Damage',
  physical: 'Physical Damage',
  two_hand: 'Two Handed Damage',
  shield: 'Shield Defence',
  minion: 'Minion Damage',
  minions: 'Minion Damage',
  curse: 'Curses',
  aura: 'Aura Effect',
  auras: 'Aura Effect',
  brand: 'Brands',
  totem: 'Totems',
  trap: 'Traps',
  mine: 'Mines',
  warcry: 'Warcries',
  warcries: 'Warcries',
  charge: 'Charge',
  charges: 'Charge',
  frenzy: 'Frenzy Charges',
  power: 'Power Charges',
  endurance: 'Endurance Charges',
  aura_effect: 'Aura Effect',
  curse_effect: 'Curse Effect',
  reservation: 'Reservation Efficiency',
  reservation_efficiency: 'Reservation Efficiency',
  recovery: 'Life and Mana Recovery',
  regen: 'Life Regeneration',
  life_regen: 'Life Regeneration',
  mana_regen: 'Mana Regeneration',
  leech: 'Life and Mana Leech',
}

function baseCategory(id: string): string {
  const clean = id.replace(/__+$/, '').replace(/_$/g, '')
  const m = clean.match(/^([a-z]+(?:_[a-z]+)*?)(?:_?\d+)?$/)
  if (!m) {
    const prefix = clean.match(/^([a-z]+)/)
    return prefix ? prefix[1] : clean
  }
  return m[1]
}

export function passiveCategory(id: string): string {
  if (id.startsWith('jewel_slot')) return 'Jewel Socket'
  if (id.startsWith('passive_keystone')) return 'Keystone'
  if (id.startsWith('Ascendancy')) return 'Ascendancy'
  if (id.startsWith('witch_sorceress')) return 'Witch / Sorceress'

  const base = baseCategory(id)
  return CATEGORY_DISPLAY[base] || base.charAt(0).toUpperCase() + base.slice(1).replace(/_/g, ' ')
}

export function passiveDisplayName(id: string): string {
  if (KEYSTONE_NAMES[id]) return KEYSTONE_NAMES[id]

  if (id.startsWith('jewel_slot')) return 'Jewel Socket'

  if (id.startsWith('Ascendancy')) {
    return id
      .replace('Ascendancy', '')
      .replace(/([A-Z])/g, ' $1')
      .replace(/\d+/g, '')
      .replace(/Small|Notable|Start/g, m => {
        if (m === 'Small') return '(Small)'
        if (m === 'Notable') return '(Notable)'
        if (m === 'Start') return '(Start)'
        return m
      })
      .trim() || 'Ascendancy Node'
  }

  if (id.startsWith('passive_keystone')) {
    const name = id.replace('passive_keystone_', '').replace(/_/g, ' ')
    return name.charAt(0).toUpperCase() + name.slice(1)
  }

  const clean = id.replace(/__+$/, '')
  const hasDash = clean.endsWith('_')
  const base = hasDash ? clean.slice(0, -1) : clean

  const m = base.match(/^([a-z_]+?)(\d+)$/)
  if (m) {
    const cat = m[1]
    const num = m[2]
    const catName = CATEGORY_DISPLAY[cat] || cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, ' ')
    return `${catName} (${num})`
  }

  const catName = CATEGORY_DISPLAY[base] || base.charAt(0).toUpperCase() + base.replace(/_/g, ' ')
  return catName
}
