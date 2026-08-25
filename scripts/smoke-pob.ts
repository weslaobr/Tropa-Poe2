import { deflateRawSync, deflateSync } from 'node:zlib';

import { InvalidPobCodeError, parsePobCode } from '../src/lib/pob-parser';

const SAMPLE_XML = `<PathOfBuilding>
  <Build level="90" className="Witch" ascendClassName="Blood Mage" mainSocketGroup="2" bandit="None" viewMode="CALCS">
    <PlayerStat stat="Life" value="4200"/>
    <PlayerStat stat="EnergyShield" value="1800"/>
    <PlayerStat stat="FireResist" value="76"/>
    <PlayerStat stat="ColdResist" value="30"/>
    <PlayerStat stat="TotalDPS" value="1234567"/>
  </Build>
  <Items>
    <Item id="1">
Rarity: RARE
Item Class: Body Armours
Blood Circle
Vaal Regalia
--------
Quality: +20% (augmented)
Energy Shield: 245
--------
Implicits: 0
--------
+45 to maximum Life
+38% to Fire Resistance
11% increased Cast Speed
</Item>
  </Items>
  <Skills>
    <SkillSet name="Main">
      <Skill label="Bossing" enabled="true" mainActiveSkill="1">
        <Gem name="Fireball" skillId="Fireball" level="20" quality="20" enabled="true"/>
        <Gem name="Elemental Focus" skillId="Support" level="20" quality="0" enabled="true"/>
      </Skill>
    </SkillSet>
  </Skills>
  <Tree spec="tree" activeSpec="1">
    <URL>https://poe2db.tw/passive-tree/#AAAabc123</URL>
  </Tree>
  <Slots>
    <Slot name="Body Armour" itemId="1"/>
    <Slot name="Weapon 1" itemId="2"/>
  </Slots>
</PathOfBuilding>`;

function toPobCode(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

let failures = 0;

function check(condition: boolean, message: string): void {
  if (condition) {
    console.log(`ok - ${message}`);
  } else {
    failures += 1;
    console.error(`FAIL - ${message}`);
  }
}

console.log('[1] Codigo com wrapper zlib (inflateSync)');
{
  const code = toPobCode(deflateSync(Buffer.from(SAMPLE_XML, 'utf-8')));
  const build = parsePobCode(code);

  check(build.metadata.className === 'Witch', 'className = Witch');
  check(build.metadata.ascendClassName === 'Blood Mage', 'ascendancy = Blood Mage');
  check(build.metadata.level === 90, 'level = 90');
  check(build.stats.find((s) => s.name === 'Life')?.value === 4200, 'stat Life = 4200');
  check(
    build.stats.find((s) => s.name === 'FireResist')?.value === 76,
    'stat FireResist = 76',
  );

  const item = build.items[0];
  check(item?.rarity === 'RARE', 'item rarity = RARE');
  check(item?.itemClass === 'Body Armours', 'item class = Body Armours');
  check(item?.name === 'Blood Circle', 'item name = Blood Circle');
  check(item?.base === 'Vaal Regalia', 'item base = Vaal Regalia');
  check(
    item?.mods.includes('+45 to maximum Life') === true,
    'mod "+45 to maximum Life" presente',
  );
  check(item?.mods.includes('Energy Shield: 245') === true, 'ES extraido como mod');

  const group = build.skills[0];
  check(group?.label === 'Bossing', 'skill group label = Bossing');
  check(group?.gems.length === 2, '2 gems no grupo');
  check(
    group?.gems.filter((g) => g.isSupport).map((g) => g.name).join(',') ===
      'Elemental Focus',
    'suporte Elemental Focus detectado',
  );

  check(build.tree?.url?.includes('#AAAabc123') === true, 'URL da arvore preservada');
  check(build.slotById['1'] === 'Body Armour', 'slot Body Armour mapeado via itemId');
  check(build.slotById['2'] === 'Weapon 1', 'slot Weapon 1 mapeado via itemId');
}

console.log('[2] Codigo com deflate raw (fallback inflateRawSync)');
{
  const code = toPobCode(deflateRawSync(Buffer.from(SAMPLE_XML, 'utf-8')));
  const build = parsePobCode(code);
  check(build.metadata.level === 90, 'fallback raw descomprime corretamente');
}

console.log('[3] Codigos invalidos');
{
  let threw = false;
  try {
    parsePobCode('isto nao e um codigo valido!!!');
  } catch (error) {
    threw = error instanceof InvalidPobCodeError;
  }
  check(threw, 'texto arbitrario rejeitado com InvalidPobCodeError');

  threw = false;
  try {
    parsePobCode('');
  } catch (error) {
    threw = error instanceof InvalidPobCodeError;
  }
  check(threw, 'string vazia rejeitada');
}

if (failures > 0) {
  console.error(`\n${failures} verificacao(oes) falharam.`);
  process.exit(1);
}
console.log('\nParser PoB: todas as verificacoes passaram.');
