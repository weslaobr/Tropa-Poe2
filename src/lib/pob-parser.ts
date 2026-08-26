import { inflateRawSync, inflateSync } from 'node:zlib';
import { XMLParser } from 'fast-xml-parser';

import type {
  BuildMetadata,
  ItemRarity,
  ParsedBuild,
  ParsedGem,
  ParsedItem,
  ParsedSkillGroup,
  ParsedTree,
  PlayerStat,
} from '@/types/poe2';

export class InvalidPobCodeError extends Error {
  constructor(message = 'Código de importação do PoB/PoE Ninja inválido.') {
    super(message);
    this.name = 'InvalidPobCodeError';
  }
}

type XmlNode = Record<string, unknown>;

const ARRAY_TAGS = new Set([
  'Item',
  'ItemSet',
  'Skill',
  'SkillSet',
  'Gem',
  'Support',
  'PlayerStat',
  'URL',
  'Slot',
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

function toInt(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function getAttrs(node: unknown): Record<string, string> {
  const attrs: Record<string, string> = {};
  if (!node || typeof node !== 'object') return attrs;
  for (const [key, value] of Object.entries(node as XmlNode)) {
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
  const obj = node as XmlNode;
  if (typeof obj['#text'] === 'string') return obj['#text'];
  const keys = Object.keys(obj).filter((k) => !k.startsWith('$'));
  for (const key of keys) {
    const val = obj[key];
    if (typeof val === 'string') return val;
  }
  return null;
}

function decodeCode(rawCode: string): string {
  const stripped = rawCode.replace(/\s+/g, '');
  const normalized = stripped.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);

  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(padded) || padded.length < 8) {
    throw new InvalidPobCodeError();
  }

  const buffer = Buffer.from(padded, 'base64');
  if (buffer.length === 0) throw new InvalidPobCodeError();

  try {
    return inflateSync(buffer).toString('utf-8');
  } catch {
    try {
      return inflateRawSync(buffer).toString('utf-8');
    } catch {
      throw new InvalidPobCodeError(
        'Não foi possível descompactar o código. Verifique se ele foi copiado por completo.',
      );
    }
  }
}

function extractRoot(xmlString: string): XmlNode {
  let parsed: Record<string, unknown>;
  try {
    parsed = xmlParser.parse(xmlString) as Record<string, unknown>;
  } catch {
    throw new InvalidPobCodeError('O conteúdo descompactado não é um XML válido do PoB.');
  }

  const rootKey = Object.keys(parsed).find((key) => key.startsWith('PathOfBuilding'));
  if (!rootKey) throw new InvalidPobCodeError('XML sem a raiz PathOfBuilding.');

  const root = parsed[rootKey];
  if (!root || typeof root !== 'object') throw new InvalidPobCodeError();
  return root as XmlNode;
}

function parseMetadata(root: XmlNode): BuildMetadata {
  const attrs = getAttrs(root.Build);
  return {
    className: attrs.className ?? 'Desconhecida',
    ascendClassName: attrs.ascendClassName || null,
    level: toInt(attrs.level),
    mainSocketGroup: toInt(attrs.mainSocketGroup),
    bandit: attrs.bandit || null,
  };
}

function parseStats(root: XmlNode): PlayerStat[] {
  const nodes = toArray<XmlNode>((root.Build as XmlNode | undefined)?.PlayerStat);
  return nodes
    .map((node) => {
      const attrs = getAttrs(node);
      return { name: attrs.stat ?? '', value: Number(attrs.value ?? NaN) };
    })
    .filter((s) => s.name.length > 0 && Number.isFinite(s.value));
}

const META_LINE_PREFIXES = [
  'Item Class:',
  'Rarity:',
  'Item Level:',
  'Level:',
  'Quality:',
  'Sockets:',
  'Variant:',
  'Selected Variant:',
  'Has Alt Variant',
  'Second Quality:',
  'Radius:',
  'Requirements:',
  'Implicits:',
  'Note:',
  'Source:',
  'Upgrade:',
  'Alternate Quality:',
];

function normalizeRarity(value: string | undefined): ItemRarity {
  const upper = (value ?? '').trim().toUpperCase();
  switch (upper) {
    case 'UNIQUE':
    case 'RELIC':
      return 'UNIQUE';
    case 'RARE':
      return 'RARE';
    case 'MAGIC':
      return 'MAGIC';
    case 'NORMAL':
      return 'NORMAL';
    case 'GEM':
      return 'GEM';
    case 'CURRENCY':
      return 'CURRENCY';
    default:
      return 'UNKNOWN';
  }
}

function isMetaLine(line: string): boolean {
  if (line.length === 0 || line === '--------') return true;
  return META_LINE_PREFIXES.some((prefix) => line.startsWith(prefix));
}

function parseItemText(text: string): Omit<ParsedItem, 'id'> {
  const blocks = text.split(/^\s*--------\s*$/m);
  const headerLines = (blocks[0] ?? '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let rarity: ItemRarity = 'UNKNOWN';
  let itemClass: string | null = null;
  const identity: string[] = [];

  for (const line of headerLines) {
    if (line.startsWith('Rarity:')) {
      rarity = normalizeRarity(line.slice('Rarity:'.length));
    } else if (line.startsWith('Item Class:')) {
      itemClass = line.slice('Item Class:'.length).trim() || null;
    } else if (!isMetaLine(line)) {
      identity.push(line);
    }
  }

  const name = identity.length > 1 ? identity[0] : null;
  const base = identity.length > 0 ? identity[identity.length - 1] : null;

  const itemLevelLine = headerLines.find((l) => l.startsWith('Item Level:'));
  const itemLevel = itemLevelLine ? toInt(itemLevelLine.split(':')[1]) : null;

  const mods = blocks
    .slice(1)
    .flatMap((block) =>
      block
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0),
    )
    .filter((line) => !isMetaLine(line));

  return { itemClass, rarity, name, base, itemLevel, mods, rawText: text.trim() };
}

function parseSlots(root: XmlNode): Record<string, string> {
  const slotById: Record<string, string> = {};

  const slotsContainer = root.Slots;
  if (slotsContainer) {
    const slotGroups = toArray<XmlNode>(slotsContainer);
    for (const group of slotGroups) {
      const slotList = toArray<XmlNode>(group.Slot);
      for (const slotNode of slotList) {
        const attrs = getAttrs(slotNode);
        const itemId = attrs.itemId;
        const name = attrs.name;
        if (itemId && name && !(itemId in slotById)) {
          slotById[itemId] = name;
        }
      }
    }
  }

  if (Object.keys(slotById).length === 0) {
    const itemsContainer = root.Items;
    if (itemsContainer) {
      const containerNodes = toArray<XmlNode>(itemsContainer);
      for (const container of containerNodes) {
        const allItems = [
          ...toArray<XmlNode>(container.Item),
          ...toArray<XmlNode>(container.ItemSet).flatMap((set) =>
            toArray<XmlNode>(set.Item),
          ),
        ];
        for (const itemNode of allItems) {
          const attrs = getAttrs(itemNode);
          const slotName = attrs.slot;
          if (attrs.id && slotName && !(attrs.id in slotById)) {
            slotById[attrs.id] = slotName;
          }
        }
      }
    }
  }

  return slotById;
}

function extractItems(node: XmlNode): XmlNode[] {
  const direct = toArray<XmlNode>(node.Item);
  const sets = toArray<XmlNode>(node.ItemSet).flatMap((set) =>
    toArray<XmlNode>(set.Item),
  );
  return [...direct, ...sets];
}

function parseItems(root: XmlNode): ParsedItem[] {
  const itemsContainer = root.Items;
  if (!itemsContainer) return [];

  const containerNodes = toArray<XmlNode>(itemsContainer);
  let allItemNodes: XmlNode[] = [];

  for (const container of containerNodes) {
    allItemNodes.push(...extractItems(container));
  }

  if (allItemNodes.length === 0 && typeof itemsContainer === 'object') {
    const container = itemsContainer as XmlNode;
    for (const key of Object.keys(container)) {
      if (key.startsWith('$') || key === '#text') continue;
      const child = container[key];
      if (typeof child === 'object' && child !== null) {
        allItemNodes.push(...extractItems(child as XmlNode));
      }
    }
  }

  return allItemNodes.map((itemNode, index) => {
    const attrs = getAttrs(itemNode);
    const text = getText(itemNode) ?? '';
    const parsed = parseItemText(text);
    return { id: attrs.id ?? String(index + 1), ...parsed };
  });
}

function prettifySkillId(raw: string): string {
  const stripped = raw
    .replace(/(?:Player(?:Two|Three|Four|Five)?|Character\d+)$/i, '')
    .replace(/^(?:Support|Vaal)(?=[A-Z])/, '')
    .trim();
  const spaced = stripped
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
  return spaced || raw;
}

function parseGems(groupNode: XmlNode): ParsedGem[] {
  const gemNodes = [
    ...toArray<XmlNode>(groupNode.Gem),
    ...toArray<XmlNode>(groupNode.Support),
  ];

  return gemNodes.map((gemNode) => {
    const attrs = getAttrs(gemNode);
    const skillId = attrs.skillId ?? '';
    return {
      name:
        attrs.name ??
        (skillId ? prettifySkillId(skillId) : null) ??
        'Desconhecida',
      level: toInt(attrs.level),
      quality: toInt(attrs.quality),
      enabled: attrs.enabled !== 'false',
      isSupport:
        skillId.toLowerCase().includes('support') === true ||
        /support/i.test(attrs.name ?? ''),
    };
  });
}

function parseSkills(root: XmlNode): ParsedSkillGroup[] {
  const skillsRoot = root.Skills as XmlNode | undefined;
  if (!skillsRoot) return [];

  const sets = toArray<XmlNode>(skillsRoot.SkillSet);
  let groupNodes: XmlNode[];

  if (sets.length) {
    groupNodes = sets.flatMap((set) => toArray<XmlNode>(set.Skill));
  } else {
    groupNodes = toArray<XmlNode>(skillsRoot.Skill);
  }

  if (groupNodes.length === 0) {
    for (const key of Object.keys(skillsRoot)) {
      if (key.startsWith('$') || key === '#text') continue;
      const child = skillsRoot[key];
      if (typeof child === 'object' && child !== null) {
        const childArray = toArray<XmlNode>(child);
        for (const item of childArray) {
          if (item.Skill || item.Gem) {
            groupNodes.push(...toArray<XmlNode>(item.Skill));
          }
        }
      }
    }
  }

  return groupNodes.map((groupNode) => {
    const attrs = getAttrs(groupNode);
    return {
      label: attrs.label || null,
      enabled: attrs.enabled !== 'false',
      gems: parseGems(groupNode),
    };
  });
}

function parseTree(root: XmlNode): ParsedTree | null {
  const treeNodes = toArray<XmlNode>(root.Tree);
  const tree = treeNodes[0];
  if (!tree) return null;

  const attrs = getAttrs(tree);
  const urls = toArray<unknown>(tree.URL)
    .map((url) => getText(url))
    .filter((url): url is string => Boolean(url));

  return {
    spec: attrs.spec || null,
    url: urls[0] ?? null,
  };
}

export function parsePobCode(pobCode: string): ParsedBuild {
  if (typeof pobCode !== 'string' || pobCode.trim().length < 8) {
    throw new InvalidPobCodeError();
  }

  const xmlString = decodeCode(pobCode);
  const root = extractRoot(xmlString);

  return {
    metadata: parseMetadata(root),
    stats: parseStats(root),
    items: parseItems(root),
    slotById: parseSlots(root),
    skills: parseSkills(root),
    tree: parseTree(root),
  };
}
