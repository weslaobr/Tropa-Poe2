#!/usr/bin/env node
/**
 * PoE2 .build file comparator
 * Compares two poe.ninja .build JSON files and shows advantages/disadvantages.
 *
 * Usage: node compare_builds.mjs <build1.build> <build2.build>
 */
import { readFileSync } from 'fs';

const ASCENDANCY_NAMES = {
  Witch2: 'Blood Mage', Witch1: 'Infernalist', Witch3: 'Stormweaver',
  Sorcerer1: 'Stormweaver', Sorcerer2: 'Chronomancer', Sorcerer3: 'N/A',
  Monk1: 'Invoker', Monk2: 'Acolyte of Chayula', Monk3: 'N/A',
  Mercenary1: 'Witchhunter', Mercenary2: 'Gemlin Legionnaire', Mercenary3: 'Tactician',
  Warrior1: 'Warbringer', Warrior2: 'Titan', Warrior3: 'Smith of Kitava',
  Ranger1: 'Deadeye', Ranger2: 'Pathfinder', Ranger3: 'N/A',
  Huntress1: 'Ritualist', Huntress2: 'Amazon', Huntress3: 'N/A',
};

function categorizePassive(id) {
  if (id.startsWith('Ascendancy')) return 'Ascendancy';
  if (id.startsWith('passive_keystone')) return 'Keystone';
  if (id.startsWith('jewel_slot')) return 'Jewel Socket';
  if (id.startsWith('witch_sorceress')) return 'Witch/Sorceress';
  if (id.startsWith('critical')) return 'Critical';
  if (id.startsWith('spell_critical')) return 'Spell Critical';
  if (id.startsWith('cast_speed')) return 'Cast Speed';
  if (id.startsWith('projectile_spell')) return 'Projectile Spell';
  if (id.startsWith('area_spell') || id.startsWith('area_attack') || id.startsWith('area_')) return 'Area';
  if (id.startsWith('spell')) return 'Spell';
  if (id.startsWith('elemental')) return 'Elemental';
  if (id.startsWith('energy_shield')) return 'Energy Shield';
  if (id.startsWith('intelligence')) return 'Intelligence';
  if (id.startsWith('dexterity')) return 'Dexterity';
  if (id.startsWith('strength')) return 'Strength';
  if (id.startsWith('attribute')) return 'Attributes';
  if (id.startsWith('duration')) return 'Duration';
  return 'Other';
}

function gemShortName(gemId) {
  const m = gemId.match(/SkillGem([\w_]+)$/) || gemId.match(/SupportGem([\w_]+)$/) || gemId.match(/\/([\w_]+)$/);
  let name = m ? m[1] : gemId;
  name = name.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ').replace(/ Two /g, ' 2 ').trim();
  return name;
}

function parseBuild(filepath) {
  const data = JSON.parse(readFileSync(filepath, 'utf-8'));
  const build = { name: data.name || 'Unnamed', author: data.author || 'Unknown',
    ascendancy: ASCENDANCY_NAMES[data.ascendancy] || data.ascendancy || 'Unknown',
    passives: [], passivesByCategory: {}, skills: [] };

  for (const p of data.passives || []) {
    const cat = categorizePassive(p.id);
    const entry = { id: p.id, weaponSet: p.weapon_set || 0, category: cat };
    build.passives.push(entry);
    (build.passivesByCategory[cat] ??= []).push(entry);
  }

  for (const s of data.skills || []) {
    build.skills.push({
      id: s.id, name: gemShortName(s.id),
      supports: (s.support_skills || []).map(ss => ({ id: ss.id, name: gemShortName(ss.id) }))
    });
  }
  return build;
}

function compareBuilds(a, b) {
  const diff = {
    buildA: { name: a.name, ascendancy: a.ascendancy, author: a.author },
    buildB: { name: b.name, ascendancy: b.ascendancy, author: b.author },
    passives: { onlyA: [], onlyB: [], shared: [] },
    passivesByCategory: {},
    skills: { onlyA: [], onlyB: [], shared: [] },
  };

  const setA = new Set(a.passives.map(p => p.id));
  const setB = new Set(b.passives.map(p => p.id));

  for (const p of a.passives) {
    const target = setB.has(p.id) ? diff.passives.shared : diff.passives.onlyA;
    target.push({ id: p.id, weaponSet: p.weaponSet });
  }
  for (const p of b.passives) {
    if (!setA.has(p.id)) diff.passives.onlyB.push({ id: p.id, weaponSet: p.weaponSet });
  }

  // by-category
  const cats = new Set([...Object.keys(a.passivesByCategory), ...Object.keys(b.passivesByCategory)]);
  for (const cat of cats) {
    const ca = new Set((a.passivesByCategory[cat] || []).map(p => p.id));
    const cb = new Set((b.passivesByCategory[cat] || []).map(p => p.id));
    diff.passivesByCategory[cat] = { onlyA: [], onlyB: [], shared: [] };
    for (const p of a.passivesByCategory[cat] || []) {
      (cb.has(p.id) ? diff.passivesByCategory[cat].shared : diff.passivesByCategory[cat].onlyA)
        .push({ id: p.id, weaponSet: p.weaponSet });
    }
    for (const p of b.passivesByCategory[cat] || []) {
      if (!ca.has(p.id)) diff.passivesByCategory[cat].onlyB.push({ id: p.id, weaponSet: p.weaponSet });
    }
  }

  // Skills
  const keyA = {}, keyB = {};
  for (const s of a.skills) { const k = s.id.match(/\/([\w_]+)$/)?.[1] || s.id; keyA[k] = s; }
  for (const s of b.skills) { const k = s.id.match(/\/([\w_]+)$/)?.[1] || s.id; keyB[k] = s; }

  for (const s of a.skills) {
    const k = s.id.match(/\/([\w_]+)$/)?.[1] || s.id;
    if (keyB[k]) {
      const shared = { name: s.name, id: s.id, supports: { onlyA: [], onlyB: [], shared: [] } };
      const supA = {}, supB = {};
      for (const ss of s.supports) { const sk = ss.id.match(/\/([\w_]+)$/)?.[1] || ss.id; supA[sk] = ss; }
      for (const ss of keyB[k].supports) { const sk = ss.id.match(/\/([\w_]+)$/)?.[1] || ss.id; supB[sk] = ss; }
      for (const ss of s.supports) {
        const sk = ss.id.match(/\/([\w_]+)$/)?.[1] || ss.id;
        (supB[sk] ? shared.supports.shared : shared.supports.onlyA).push(ss.name);
      }
      for (const ss of keyB[k].supports) {
        const sk = ss.id.match(/\/([\w_]+)$/)?.[1] || ss.id;
        if (!supA[sk]) shared.supports.onlyB.push(ss.name);
      }
      diff.skills.shared.push(shared);
    } else diff.skills.onlyA.push(s);
  }
  for (const s of b.skills) {
    const k = s.id.match(/\/([\w_]+)$/)?.[1] || s.id;
    if (!keyA[k]) diff.skills.onlyB.push(s);
  }

  diff.summary = {
    totalPassivesA: a.passives.length, totalPassivesB: b.passives.length,
    sharedPassives: diff.passives.shared.length,
    uniquePassivesA: diff.passives.onlyA.length, uniquePassivesB: diff.passives.onlyB.length,
    totalSkillsA: a.skills.length, totalSkillsB: b.skills.length,
    sharedSkills: diff.skills.shared.length,
    uniqueSkillsA: diff.skills.onlyA.length, uniqueSkillsB: diff.skills.onlyB.length,
  };
  return diff;
}

function printDiff(diff) {
  const s = diff.summary;
  const L = (label, val) => `  ${label.padEnd(20)} ${String(val).padStart(6)}`;
  console.log(`\n${'='.repeat(60)}\n  BUILD COMPARISON\n${'='.repeat(60)}\n`);
  console.log(`  Build A: ${diff.buildA.name} (${diff.buildA.ascendancy})`);
  console.log(`  Build B: ${diff.buildB.name} (${diff.buildB.ascendancy})\n`);
  console.log(`  ${'─'.repeat(56)}`);
  console.log(`  ${'SUMMARY'.padStart(30)}\n${'─'.repeat(56)}`);
  console.log(`  ${''.padEnd(20)} ${'A'.padStart(8)} ${'B'.padStart(8)} ${'Shared'.padStart(8)} ${'UniqA'.padStart(8)} ${'UniqB'.padStart(8)}`);
  console.log(`  ${'Passives'.padEnd(20)} ${String(s.totalPassivesA).padStart(8)} ${String(s.totalPassivesB).padStart(8)} ${String(s.sharedPassives).padStart(8)} ${String(s.uniquePassivesA).padStart(8)} ${String(s.uniquePassivesB).padStart(8)}`);
  console.log(`  ${'Skills'.padEnd(20)} ${String(s.totalSkillsA).padStart(8)} ${String(s.totalSkillsB).padStart(8)} ${String(s.sharedSkills).padStart(8)} ${String(s.uniqueSkillsA).padStart(8)} ${String(s.uniqueSkillsB).padStart(8)}\n`);

  if (s.sharedPassives > 0) {
    console.log(`  SHARED PASSIVES (${s.sharedPassives})`);
    for (const p of diff.passives.shared) console.log(`    ${p.id}${p.weaponSet ? ` (WS${p.weaponSet})` : ''}`);
    console.log();
  }

  const printPassives = (items, label) => {
    if (!items.length) return;
    const byCat = {};
    for (const p of items) (byCat[categorizePassive(p.id)] ??= []).push(p);
    console.log(`  ${label}`);
    for (const [cat, list] of Object.entries(byCat).sort()) {
      console.log(`    [${cat}]`);
      for (const p of list) console.log(`      ${p.id}${p.weaponSet ? ` (WS${p.weaponSet})` : ''}`);
    }
    console.log();
  };

  printPassives(diff.passives.onlyA, `UNIQUE TO BUILD A (${diff.buildA.name})`);
  printPassives(diff.passives.onlyB, `UNIQUE TO BUILD B (${diff.buildB.name})`);

  if (s.sharedSkills > 0) {
    console.log(`  SHARED SKILLS (${s.sharedSkills})`);
    for (const sk of diff.skills.shared) {
      console.log(`    ${sk.name}`);
      if (sk.supports.shared.length) console.log(`      Supports: ${sk.supports.shared.join(', ')}`);
      if (sk.supports.onlyA.length) console.log(`      Only in A: ${sk.supports.onlyA.join(', ')}`);
      if (sk.supports.onlyB.length) console.log(`      Only in B: ${sk.supports.onlyB.join(', ')}`);
    }
    console.log();
  }

  const printSkills = (items, label) => {
    if (!items.length) return;
    console.log(`  ${label}`);
    for (const sk of items) {
      console.log(`    ${sk.name}`);
      if (sk.supports?.length) console.log(`      Supports: ${sk.supports.map(ss => ss.name).join(', ')}`);
    }
    console.log();
  };

  printSkills(diff.skills.onlyA, `SKILLS ONLY IN BUILD A (${diff.buildA.name})`);
  printSkills(diff.skills.onlyB, `SKILLS ONLY IN BUILD B (${diff.buildB.name})`);
}

function main() {
  const args = process.argv.slice(2);
  if (args.length !== 2) {
    console.log('Usage: node compare_builds.mjs <build1.build> <build2.build>');
    process.exit(1);
  }
  const a = parseBuild(args[0]);
  const b = parseBuild(args[1]);
  printDiff(compareBuilds(a, b));
}

main();
