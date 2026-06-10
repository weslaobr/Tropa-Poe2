/**
 * lib/mockData.ts — Mock data for development and UI preview
 *
 * Provides realistic mock character and build data so you can develop
 * the UI without needing actual GGG API access or a real .build file.
 *
 * Replace with real API calls in production.
 */

import type { GGGCharacter, BuildFile, BuildDiffResult } from '@/types/app'

export const MOCK_CHARACTER: GGGCharacter = {
  name:       'ShadowstepKira',
  class:      'Ranger',
  league:     'Standard',
  level:      68,
  experience: 1_284_566_720,
  equipment:  [],
  passives: [
    { id: 'node_100', name: 'Acrobatics',        allocated: true,  stats: ['+8% chance to Dodge Attack Hits'] },
    { id: 'node_101', name: 'Phase Acrobatics',   allocated: true,  stats: ['+6% chance to Dodge Spell Hits'] },
    { id: 'node_102', name: 'Arcing Shot',         allocated: true,  stats: ['Projectiles Pierce an additional Target'] },
    { id: 'node_103', name: 'Heartseeker',         allocated: true,  stats: ['+40% to Critical Strike Multiplier'] },
    { id: 'node_104', name: 'Pressure Points',     allocated: true,  stats: ['+30% to Critical Strike Multiplier'] },
    { id: 'node_105', name: 'Vaal Pact',            allocated: false, stats: ['Life Leech applies instantly'] },
    { id: 'node_106', name: 'Blood Drinker',        allocated: false, stats: ['+2% of Physical Attack Damage Leeched as Life'] },
    { id: 'node_107', name: 'Cloth and Chain',      allocated: false, stats: ['+12% to Evasion Rating'] },
    { id: 'node_108', name: 'Frenzy Charge',        allocated: false, stats: ['Gain +1 Maximum Frenzy Charge'] },
    { id: 'node_109', name: 'Quill Rain Duration',  allocated: false, stats: ['Projectile Speed +15%'] },
    { id: 'node_110', name: 'Master Fletcher',      allocated: false, stats: ['Bow Attacks fire an additional Arrow'] },
  ],
  gems: [
    { id: 'g1', name: 'Tornado Shot',        level: 18, quality: 15, socketGroup: 'Weapon', isSupport: false },
    { id: 'g2', name: 'Barrage Support',     level: 16, quality: 10, socketGroup: 'Weapon', isSupport: true  },
    { id: 'g3', name: 'Faster Attacks',      level: 14, quality: 0,  socketGroup: 'Weapon', isSupport: true  },
    { id: 'g4', name: 'Culling Strike',      level: 12, quality: 0,  socketGroup: 'Weapon', isSupport: true  },
    // Missing: Mirage Archer, Inspiration Support, Haste
    { id: 'g5', name: 'Haste',              level: 15, quality: 8,  socketGroup: 'Helm',   isSupport: false },
    { id: 'g6', name: 'Vitality',           level: 1,  quality: 0,  socketGroup: 'Helm',   isSupport: false },
    { id: 'g7', name: 'Clarity',            level: 10, quality: 0,  socketGroup: 'Helm',   isSupport: false },
    { id: 'g8', name: 'Increased Duration', level: 16, quality: 0,  socketGroup: 'Helm',   isSupport: true  },
  ],
}

export const MOCK_BUILD_FILE: BuildFile = {
  version:  '2.0',
  class:    'Ranger',
  fileName: 'TR_Ranger_Endgame.build',
  levelMilestones: [
    {
      level:            1,
      label:            'Early Game',
      requiredPassives: ['node_100', 'node_101'],
      requiredGems:     ['Tornado Shot', 'Faster Attacks'],
    },
    {
      level:            40,
      label:            'Mid Game',
      requiredPassives: ['node_102', 'node_103', 'node_104'],
      requiredGems:     ['Barrage Support', 'Culling Strike', 'Haste'],
    },
    {
      level:            60,
      label:            'Late Game',
      requiredPassives: ['node_105', 'node_106', 'node_107'],
      requiredGems:     ['Mirage Archer', 'Inspiration Support'],
    },
    {
      level:            80,
      label:            'Endgame',
      requiredPassives: ['node_108', 'node_109', 'node_110'],
      requiredGems:     ['Awakened Barrage Support'],
    },
  ],
  plannedPassives: [
    { id: 'node_100', name: 'Acrobatics',        allocated: false, stats: ['+8% chance to Dodge Attack Hits'] },
    { id: 'node_101', name: 'Phase Acrobatics',   allocated: false, stats: ['+6% chance to Dodge Spell Hits'] },
    { id: 'node_102', name: 'Arcing Shot',         allocated: false, stats: ['Projectiles Pierce an additional Target'] },
    { id: 'node_103', name: 'Heartseeker',         allocated: false, stats: ['+40% to Critical Strike Multiplier'] },
    { id: 'node_104', name: 'Pressure Points',     allocated: false, stats: ['+30% to Critical Strike Multiplier'] },
    { id: 'node_105', name: 'Vaal Pact',            allocated: false, stats: ['Life Leech applies instantly'] },
    { id: 'node_106', name: 'Blood Drinker',        allocated: false, stats: ['+2% of Physical Attack Damage Leeched as Life'] },
    { id: 'node_107', name: 'Cloth and Chain',      allocated: false, stats: ['+12% to Evasion Rating'] },
    { id: 'node_108', name: 'Frenzy Charge',        allocated: false, stats: ['Gain +1 Maximum Frenzy Charge'] },
    { id: 'node_109', name: 'Quill Rain Duration',  allocated: false, stats: ['Projectile Speed +15%'] },
    { id: 'node_110', name: 'Master Fletcher',      allocated: false, stats: ['Bow Attacks fire an additional Arrow'] },
  ],
  plannedGems: [
    {
      groupLabel: 'Main Skill',
      gems: [
        { name: 'Tornado Shot',         minLevel: 20, isSupport: false, isRequired: true  },
        { name: 'Barrage Support',       minLevel: 20, isSupport: true,  isRequired: true  },
        { name: 'Mirage Archer',         minLevel: 20, isSupport: true,  isRequired: true  },
        { name: 'Inspiration Support',   minLevel: 20, isSupport: true,  isRequired: true  },
        { name: 'Faster Attacks',        minLevel: 20, isSupport: true,  isRequired: true  },
        { name: 'Culling Strike',        minLevel: 20, isSupport: true,  isRequired: false },
      ],
    },
    {
      groupLabel: 'Aura Setup',
      gems: [
        { name: 'Haste',              minLevel: 20, isSupport: false, isRequired: true  },
        { name: 'Vitality',           minLevel: 1,  isSupport: false, isRequired: false },
        { name: 'Clarity',            minLevel: 20, isSupport: false, isRequired: false },
        { name: 'Increased Duration', minLevel: 20, isSupport: true,  isRequired: false },
      ],
    },
    {
      groupLabel: 'Movement',
      gems: [
        { name: 'Dash',          minLevel: 6,  isSupport: false, isRequired: true  },
        { name: 'Second Wind',   minLevel: 1,  isSupport: true,  isRequired: false },
      ],
    },
  ],
  targetStats: {
    strength:        100,
    dexterity:       250,
    intelligence:    80,
    life:            4500,
    mana:            1200,
    energyShield:    0,
    resistFire:      75,
    resistCold:      75,
    resistLightning: 75,
    resistChaos:     0,
    dps:             500_000,
  },
}

/**
 * Generates a mock diff result for UI development.
 * In production this is produced by runBuildDiff(build, character).
 */
export function getMockDiffResult(): BuildDiffResult {
  return {
    overallProgress: 45,
    passiveDiff: {
      totalPlanned:   11,
      totalAllocated: 5,
      allocated: MOCK_CHARACTER.passives!.filter(p => p.allocated),
      missing:   MOCK_CHARACTER.passives!.filter(p => !p.allocated),
      nextRecommended: [
        { id: 'node_105', name: 'Vaal Pact',      allocated: false, stats: ['Life Leech applies instantly'] },
        { id: 'node_106', name: 'Blood Drinker',   allocated: false, stats: ['+2% Physical Attack Damage Leeched as Life'] },
        { id: 'node_107', name: 'Cloth and Chain', allocated: false, stats: ['+12% to Evasion Rating'] },
      ],
    },
    gemDiff: {
      links: [
        {
          groupLabel: 'Main Skill',
          planned: MOCK_BUILD_FILE.plannedGems[0].gems,
          current: MOCK_CHARACTER.gems!.filter(g => g.socketGroup === 'Weapon'),
          missingGems: [
            { name: 'Mirage Archer',       minLevel: 20, isSupport: true,  isRequired: true },
            { name: 'Inspiration Support', minLevel: 20, isSupport: true,  isRequired: true },
          ],
          correctGems: [
            { name: 'Tornado Shot',  minLevel: 20, isSupport: false, isRequired: true },
          ],
          underleveledGems: [
            {
              planned: { name: 'Barrage Support', minLevel: 20, isSupport: true, isRequired: true },
              current: { id: 'g2', name: 'Barrage Support', level: 16, quality: 10, socketGroup: 'Weapon', isSupport: true },
              deficit: 4,
            },
            {
              planned: { name: 'Faster Attacks', minLevel: 20, isSupport: true, isRequired: true },
              current: { id: 'g3', name: 'Faster Attacks', level: 14, quality: 0, socketGroup: 'Weapon', isSupport: true },
              deficit: 6,
            },
          ],
        },
        {
          groupLabel: 'Aura Setup',
          planned: MOCK_BUILD_FILE.plannedGems[1].gems,
          current: MOCK_CHARACTER.gems!.filter(g => g.socketGroup === 'Helm'),
          missingGems: [],
          correctGems: [
            { name: 'Vitality', minLevel: 1, isSupport: false, isRequired: false },
          ],
          underleveledGems: [
            {
              planned: { name: 'Haste',              minLevel: 20, isSupport: false, isRequired: true },
              current: { id: 'g5', name: 'Haste', level: 15, quality: 8, socketGroup: 'Helm', isSupport: false },
              deficit: 5,
            },
            {
              planned: { name: 'Clarity',            minLevel: 20, isSupport: false, isRequired: false },
              current: { id: 'g7', name: 'Clarity', level: 10, quality: 0, socketGroup: 'Helm', isSupport: false },
              deficit: 10,
            },
            {
              planned: { name: 'Increased Duration', minLevel: 20, isSupport: true,  isRequired: false },
              current: { id: 'g8', name: 'Increased Duration', level: 16, quality: 0, socketGroup: 'Helm', isSupport: true },
              deficit: 4,
            },
          ],
        },
        {
          groupLabel: 'Movement',
          planned: MOCK_BUILD_FILE.plannedGems[2].gems,
          current: [],
          missingGems: [
            { name: 'Dash',        minLevel: 6, isSupport: false, isRequired: true  },
            { name: 'Second Wind', minLevel: 1, isSupport: true,  isRequired: false },
          ],
          correctGems:     [],
          underleveledGems: [],
        },
      ],
    },
    statDiff: {
      current: {
        strength:        144,
        dexterity:       198,
        intelligence:    97,
        life:            2936,
        mana:            740,
        energyShield:    0,
        resistFire:      71,
        resistCold:      56,
        resistLightning: 67,
        resistChaos:     -60,
      },
      target: {
        strength:        100,
        dexterity:       250,
        intelligence:    80,
        life:            4500,
        mana:            1200,
        energyShield:    0,
        resistFire:      75,
        resistCold:      75,
        resistLightning: 75,
        resistChaos:     0,
      },
      delta: {
        strength:        44,    // surplus
        dexterity:       -52,   // deficit
        intelligence:    17,    // surplus
        life:            -1564, // deficit
        mana:            -460,  // deficit
        energyShield:    0,
        resistFire:      -4,    // deficit
        resistCold:      -19,   // deficit
        resistLightning: -8,    // deficit
        resistChaos:     -60,   // deficit
      },
    },
  }
}
