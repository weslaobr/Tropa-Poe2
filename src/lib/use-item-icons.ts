'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'tropa-poe2.icons.v2';
const TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_BATCH = 30;

type IconCacheData = Record<string, { url: string | null; at: number }>;

function readCache(): IconCacheData {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as IconCacheData) : {};
  } catch {
    return {};
  }
}

function writeCache(cache: IconCacheData): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    /* storage cheio/indisponivel: ignora */
  }
}

export function useItemIcons(names: string[]): Record<string, string | null> {
  const [icons, setIcons] = useState<Record<string, string | null>>({});
  const key = names.join('\u0000');

  useEffect(() => {
    const list = key ? key.split('\u0000') : [];
    if (list.length === 0) return;

    const cache = readCache();
    const now = Date.now();
    const resolved: Record<string, string | null> = {};
    const missing: string[] = [];

    for (const name of list) {
      const hit = cache[name];
      if (hit && now - hit.at < TTL_MS) {
        resolved[name] = hit.url;
      } else {
        missing.push(name);
      }
    }

    setIcons(resolved);
    if (missing.length === 0) return;

    let cancelled = false;

    fetch('/api/item-icons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ names: missing.slice(0, MAX_BATCH) }),
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { icons?: Record<string, string | null> } | null) => {
        if (cancelled || !data?.icons) return;
        const fresh = readCache();
        for (const [name, url] of Object.entries(data.icons)) {
          fresh[name] = { url, at: Date.now() };
        }
        writeCache(fresh);
        setIcons((prev) => ({ ...prev, ...data.icons }));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [key]);

  return icons;
}
