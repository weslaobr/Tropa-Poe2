import type { StoredBuild } from '@/types/poe2';

import { computeBuildId } from './build-id';

const STORAGE_KEY = 'tropa-poe2.builds.v1';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function readAll(): Record<string, StoredBuild> {
  if (!isBrowser()) return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, StoredBuild>) : {};
  } catch {
    return {};
  }
}

function writeAll(builds: Record<string, StoredBuild>): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(builds));
}

export function saveBuild(code: string, build: StoredBuild['build']): StoredBuild {
  const id = computeBuildId(code);
  const stored: StoredBuild = {
    id,
    code,
    importedAt: new Date().toISOString(),
    build,
  };

  const all = readAll();
  all[id] = stored;
  writeAll(all);
  return stored;
}

export function getStoredBuild(id: string): StoredBuild | null {
  return readAll()[id] ?? null;
}

export function listStoredBuilds(): StoredBuild[] {
  return Object.values(readAll()).sort(
    (a, b) => Date.parse(b.importedAt) - Date.parse(a.importedAt),
  );
}

export function removeBuild(id: string): void {
  const all = readAll();
  delete all[id];
  writeAll(all);
}
