import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const POE2DB_PAGE_BASE = 'https://poe2db.tw/us';
const CDN_PREFIX = 'https://cdn.poe2db.tw/image/';
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const MAX_PER_REQUEST = 40;
const REQUEST_GAP_MS = 600;
const NEGATIVE_TTL_MS = 24 * 60 * 60 * 1000;
const POSITIVE_TTL_MS = 90 * 24 * 60 * 60 * 1000;

const GEM_INDEX_PAGES = ['Skill_Gems', 'Support_Gems'];
const GEM_INDEX_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface CacheEntry {
  url: string | null;
  at: number;
}

const memoryCache = new Map<string, CacheEntry>();

const DISK_CACHE_DIR = path.join(process.cwd(), '.cache');
const DISK_CACHE_FILE = path.join(DISK_CACHE_DIR, 'poe2db-icons.json');
const GEM_INDEX_FILE = path.join(DISK_CACHE_DIR, 'poe2db-gem-index.json');

let diskLoaded = false;
let diskSaveTimer: NodeJS.Timeout | null = null;

let gemIndex: Map<string, string> | null = null;
let gemIndexPromise: Promise<Map<string, string>> | null = null;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadDiskCache(): Promise<void> {
  if (diskLoaded) return;
  diskLoaded = true;
  try {
    const raw = await readFile(DISK_CACHE_FILE, 'utf8');
    const data = JSON.parse(raw) as Record<string, CacheEntry>;
    for (const [name, entry] of Object.entries(data)) {
      if (!memoryCache.has(name)) memoryCache.set(name, entry);
    }
  } catch {
    /* arquivo ausente/corrompido: comeca vazio */
  }
}

function scheduleDiskSave(): void {
  if (diskSaveTimer) return;
  diskSaveTimer = setTimeout(() => {
    diskSaveTimer = null;
    const payload = Object.fromEntries(memoryCache);
    mkdir(DISK_CACHE_DIR, { recursive: true })
      .then(() => writeFile(DISK_CACHE_FILE, JSON.stringify(payload), 'utf8'))
      .catch(() => {});
  }, 1500);
  diskSaveTimer.unref?.();
}

export function normalizeKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function stripPoBJunk(name: string): string {
  return name
    .replace(/(?:Player(?:Two|Three|Four|Five)?|Character\d+)$/i, '')
    .trim();
}

const ANCHOR_ICON_PATTERN =
  '<a[^>]+href="(/us/[A-Za-z0-9_%]+)"[^>]*>\\s*<img[^>]+src="(https://cdn\\.poe2db\\.tw/image/[^"]+)"';

async function fetchPageHtml(url: string): Promise<string | null> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': BROWSER_UA,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    signal: AbortSignal.timeout(20000),
    cache: 'no-store',
  });
  if (!response.ok) return null;
  return response.text();
}

interface GemIndexPayload {
  at: number;
  entries: Record<string, string>;
}

async function loadGemIndex(): Promise<Map<string, string>> {
  if (gemIndex) return gemIndex;

  try {
    const raw = await readFile(GEM_INDEX_FILE, 'utf8');
    const payload = JSON.parse(raw) as GemIndexPayload;
    if (Date.now() - payload.at < GEM_INDEX_TTL_MS && payload.entries) {
      gemIndex = new Map(Object.entries(payload.entries));
      return gemIndex;
    }
  } catch {
    /* sem indice em disco */
  }

  const entries: Record<string, string> = {};
  for (const page of GEM_INDEX_PAGES) {
    try {
      await sleep(REQUEST_GAP_MS);
      const html = await fetchPageHtml(`${POE2DB_PAGE_BASE}/${page}`);
      if (!html) continue;
      const pattern = new RegExp(ANCHOR_ICON_PATTERN, 'g');
      for (const match of html.matchAll(pattern)) {
        const slug = decodeURIComponent(match[1].slice(4)).replace(/_/g, ' ');
        const icon = match[2];
        if (!slug || !icon) continue;
        entries[slug] = icon;
      }
    } catch {
      continue;
    }
  }

  if (Object.keys(entries).length === 0) {
    gemIndex = gemIndex ?? new Map();
    return gemIndex;
  }

  gemIndex = new Map();
  for (const [displayName, icon] of Object.entries(entries)) {
    gemIndex.set(normalizeKey(stripPoBJunk(displayName)), icon);
    gemIndex.set(`support${normalizeKey(stripPoBJunk(displayName))}`, icon);
    gemIndex.set(`vaal${normalizeKey(stripPoBJunk(displayName))}`, icon);
  }

  mkdir(DISK_CACHE_DIR, { recursive: true })
    .then(() =>
      writeFile(
        GEM_INDEX_FILE,
        JSON.stringify({ at: Date.now(), entries } satisfies GemIndexPayload),
        'utf8',
      ),
    )
    .catch(() => {});

  return gemIndex;
}

function getCachedGemIndex(): Promise<Map<string, string>> {
  if (!gemIndexPromise) {
    gemIndexPromise = loadGemIndex().catch(() => new Map<string, string>());
  }
  return gemIndexPromise;
}

const OG_IMAGE_PATTERNS = [
  /<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
  /<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
];

function extractIconUrl(html: string): string | null {
  for (const pattern of OG_IMAGE_PATTERNS) {
    const match = html.match(pattern);
    const url = match?.[1];
    if (url && url.startsWith(CDN_PREFIX)) return url;
  }
  return null;
}

function pageUrl(candidate: string): string {
  return `${POE2DB_PAGE_BASE}/${encodeURIComponent(candidate.replace(/\s+/g, '_'))}`;
}

function slugCandidates(rawName: string): string[] {
  const name = stripPoBJunk(rawName.trim());
  const roots = [name];

  const unTired = name.replace(/^(?:Advanced|Expert)\s+/i, '').trim();
  if (unTired && unTired !== name) roots.push(unTired);

  const candidates = [...roots];
  for (const root of roots) {
    const spaced = root
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .trim();
    if (spaced && spaced !== root) candidates.push(spaced);
  }

  return [...new Set(candidates)];
}

async function resolveViaPageScrape(name: string): Promise<string | null> {
  for (const candidate of slugCandidates(name)) {
    try {
      const html = await fetchPageHtml(pageUrl(candidate));
      if (!html) continue;
      const icon = extractIconUrl(html);
      if (icon) return icon;
    } catch {
      continue;
    }
  }
  return null;
}

async function resolveOne(name: string): Promise<string | null> {
  const stripped = stripPoBJunk(name.trim());
  const index = await getCachedGemIndex();

  const directKeys = [
    normalizeKey(stripped),
    normalizeKey(name.trim()),
    `support${normalizeKey(stripped)}`,
  ];
  for (const key of directKeys) {
    const hit = index.get(key);
    if (hit) return hit;
  }

  return resolveViaPageScrape(stripped);
}

function cachedValid(entry: CacheEntry | undefined): boolean {
  if (!entry) return false;
  const ttl = entry.url === null ? NEGATIVE_TTL_MS : POSITIVE_TTL_MS;
  return Date.now() - entry.at < ttl;
}

export async function resolveItemIcons(
  names: string[],
): Promise<Record<string, string | null>> {
  await loadDiskCache();

  const result: Record<string, string | null> = {};
  const pending = new Set<string>();

  for (const raw of names.slice(0, MAX_PER_REQUEST)) {
    const name = raw.trim();
    if (!name) continue;
    const entry = memoryCache.get(name);
    if (cachedValid(entry)) {
      result[name] = entry?.url ?? null;
    } else {
      pending.add(name);
    }
  }

  let lastRequestAt = 0;
  const queue = [...pending];
  async function worker(): Promise<void> {
    for (;;) {
      const name = queue.shift();
      if (!name) return;

      const gap = lastRequestAt + REQUEST_GAP_MS - Date.now();
      if (gap > 0) await sleep(gap);
      lastRequestAt = Date.now();

      const url = await resolveOne(name);
      memoryCache.set(name, { url, at: Date.now() });
      result[name] = url;
      scheduleDiskSave();
    }
  }

  await worker();

  return result;
}
