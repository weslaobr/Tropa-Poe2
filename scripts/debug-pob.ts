/**
 * Script de diagnóstico: colhe um código PoB real e mostra tudo que o parser extrai.
 *
 * Uso:
 *   npx tsx scripts/debug-pob.ts "<cole-o-codigo-aqui>"
 *
 * Se nenhum argumento for passado, usa um XML de teste.
 */

import { inflateRawSync, inflateSync } from 'node:zlib';

function decodeCode(rawCode: string): string {
  const stripped = rawCode.replace(/\s+/g, '');
  const normalized = stripped.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const buffer = Buffer.from(padded, 'base64');
  if (buffer.length === 0) throw new Error('buffer vazio');

  try {
    return inflateSync(buffer).toString('utf-8');
  } catch {
    return inflateRawSync(buffer).toString('utf-8');
  }
}

import { XMLParser } from 'fast-xml-parser';

const ARRAY_TAGS = new Set([
  'Item', 'ItemSet', 'Skill', 'SkillSet', 'Gem', 'Support',
  'PlayerStat', 'URL', 'Slot',
]);

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '$',
  parseTagValue: false,
  trimValues: true,
  isArray: (tagName: string) => ARRAY_TAGS.has(tagName),
});

function toArray<T>(value: unknown): T[] {
  if (value === undefined || value === null) return [];
  return (Array.isArray(value) ? value : [value]) as T[];
}

function getAttrs(node: unknown): Record<string, string> {
  const attrs: Record<string, string> = {};
  if (!node || typeof node !== 'object') return attrs;
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (key.startsWith('$') && key.length > 1 && typeof value === 'string') {
      attrs[key.slice(1)] = value;
    }
  }
  return attrs;
}

function getText(node: unknown): string | null {
  if (node === undefined || node === null) return null;
  if (typeof node === 'string') return node;
  if (typeof node !== 'object') return null;
  const text = (node as Record<string, unknown>)['#text'] as unknown;
  return typeof text === 'string' ? text : null;
}

const rawCode = process.argv[2] ?? '';

if (!rawCode) {
  console.error('Uso: npx tsx scripts/debug-pob.ts "<codigo-pob>"');
  process.exit(1);
}

try {
  const xmlString = decodeCode(rawCode);

  console.log('=== XML DESCOMPACTADO (primeiros 3000 chars) ===');
  console.log(xmlString.slice(0, 3000));
  console.log('...\n');

  const parsed = xmlParser.parse(xmlString) as Record<string, unknown>;

  const rootKey = Object.keys(parsed).find((key) => key.startsWith('PathOfBuilding'));
  if (!rootKey) {
    console.error('Nenhuma chave PathOfBuilding encontrada!');
    console.log('Chaves raiz:', Object.keys(parsed));
    process.exit(1);
  }
  console.log(`Root key: "${rootKey}"`);

  const root = parsed[rootKey] as Record<string, unknown>;
  console.log('Chaves dentro do root:', Object.keys(root));

  // Build metadata
  const build = root.Build as Record<string, unknown> | undefined;
  if (build) {
    const attrs = getAttrs(build);
    console.log('\n=== BUILD METADATA ===');
    console.log(attrs);
  }

  // Items
  const itemsContainer = root.Items;
  console.log('\n=== ITEMS ===');
  console.log('root.Items type:', typeof itemsContainer);

  if (itemsContainer) {
    const itemsNodes = toArray<Record<string, unknown>>(itemsContainer);
    console.log('Items container count:', itemsNodes.length);

    for (let i = 0; i < itemsNodes.length; i++) {
      const itemsNode = itemsNodes[i];
      const directItems = toArray<Record<string, unknown>>(itemsNode.Item);
      const itemSets = toArray<Record<string, unknown>>(itemsNode.ItemSet);
      console.log(`\n  Items[${i}]: direct=${directItems.length}, itemSets=${itemSets.length}`);

      for (let j = 0; j < directItems.length; j++) {
        const item = directItems[j];
        const attrs = getAttrs(item);
        const text = getText(item);
        const preview = text ? text.split('\n').slice(0, 5).join(' | ') : '(sem texto)';
        console.log(`    Item[${j}]: id=${attrs.id}, slot=${attrs.slot ?? '(nenhum)'}, text=${preview}`);
      }

      for (let k = 0; k < itemSets.length; k++) {
        const itemSet = itemSets[k];
        const setAttrs = getAttrs(itemSet);
        const setItems = toArray<Record<string, unknown>>(itemSet.Item);
        console.log(`    ItemSet[${k}]: name=${setAttrs.name ?? '(nenhum)'}, items=${setItems.length}`);
        for (let j = 0; j < setItems.length; j++) {
          const item = setItems[j];
          const attrs = getAttrs(item);
          const text = getText(item);
          const preview = text ? text.split('\n').slice(0, 5).join(' | ') : '(sem texto)';
          console.log(`      Item[${j}]: id=${attrs.id}, slot=${attrs.slot ?? '(nenhum)'}, text=${preview}`);
        }
      }
    }
  }

  // Slots
  console.log('\n=== SLOTS ===');
  const slotsContainer = root.Slots;
  if (slotsContainer) {
    const slotsNodes = toArray<Record<string, unknown>>(slotsContainer);
    for (const slotsNode of slotsNodes) {
      const slotList = toArray<Record<string, unknown>>(slotsNode.Slot);
      console.log(`Slot group: ${slotList.length} slots`);
      for (const slot of slotList) {
        const attrs = getAttrs(slot);
        console.log(`  name="${attrs.name}", itemId="${attrs.itemId}"`);
      }
    }
  } else {
    console.log('(nenhum elemento <Slots> encontrado)');
  }

  // Skills
  console.log('\n=== SKILLS ===');
  const skillsRoot = root.Skills as Record<string, unknown> | undefined;
  if (skillsRoot) {
    const sets = toArray<Record<string, unknown>>(skillsRoot.SkillSet);
    const skills = sets.length
      ? sets.flatMap((set) => toArray<Record<string, unknown>>(set.Skill))
      : toArray<Record<string, unknown>>(skillsRoot.Skill);
    console.log(`Skill groups: ${skills.length}`);
    for (const skill of skills.slice(0, 3)) {
      const attrs = getAttrs(skill);
      const gems = [
        ...toArray<Record<string, unknown>>(skill.Gem),
        ...toArray<Record<string, unknown>>(skill.Support),
      ];
      console.log(`  label="${attrs.label}", gems=${gems.length}`);
    }
  }

  console.log('\n=== DIAGNÓSTICO CONCLUÍDO ===');
} catch (error) {
  console.error('Erro:', (error as Error).message);
  process.exit(1);
}
