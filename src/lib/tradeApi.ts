export interface TradeStatFilter {
  id: string
  value?: { min?: number; max?: number }
  disabled?: boolean
}

export interface TradeStatsGroup {
  type: 'and' | 'count' | 'not'
  filters: TradeStatFilter[]
  value?: { min: number }
}

export interface TradeSearchRequest {
  query: {
    status: { option: 'online' | 'any' }
    stats: TradeStatsGroup[]
    filters?: {
      type_filters?: {
        filters: Record<string, { option?: string; min?: number; max?: number }>
      }
      misc_filters?: {
        filters: Record<string, { option?: string; min?: number; max?: number }>
      }
      trade_filters?: {
        filters: Record<string, { option?: string; min?: number; max?: number }>
      }
    }
  }
  sort: { price: 'asc' | 'desc' }
}

export interface TradeSearchResponse {
  id: string
  complexity?: number
  total: number
  result: string[]
  url?: string
}

export interface TradeFetchItem {
  id: string
  listing: {
    indexed: string
    method: string
    price: { amount: number; currency: string }
    stash: { name: string; x: number; y: number }
    account: { name: string; lastCharacterName: string; online?: { league: string } }
    whisper: string
  }
  item: {
    id: string
    name: string
    typeLine: string
    baseType: string
    rarity?: string
    ilvl: number
    identified: boolean
    corrupted?: boolean
    note?: string
    implicitMods?: string[]
    explicitMods: string[]
    runeMods?: string[]
    craftedMods?: string[]
    fracturedMods?: string[]
    socketedItems?: any[]
    properties?: { name: string; values: [string, number][]; displayMode: number }[]
    requirements?: { name: string; values: [string, number][]; displayMode: number }[]
    frameType: number
    icon?: string
    inventoryId?: string
    w?: number
    h?: number
  }
  whisper?: string
}

export interface TradeFetchResponse {
  result: TradeFetchItem[]
}

const POE_TRADE_API = 'https://www.pathofexile.com/api/trade2'

export async function searchTrade(
  league: string,
  body: TradeSearchRequest,
): Promise<TradeSearchResponse> {
  const url = `${POE_TRADE_API}/search/poe2/${encodeURIComponent(league)}`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'PoE2SyncCompanion/0.1.0 (contact: your@email.com)',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Trade search failed (${response.status}): ${text}`)
  }

  return response.json()
}

export async function fetchTradeItems(
  ids: string[],
  queryId: string,
): Promise<TradeFetchItem[]> {
  const chunkSize = 10
  const results: TradeFetchItem[] = []

  for (let i = 0; i < ids.length && i < 50; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize)
    const url = `${POE_TRADE_API}/fetch/poe2/${chunk.join(',')}?query=${queryId}`
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'PoE2SyncCompanion/0.1.0 (contact: your@email.com)',
      },
    })

    if (!response.ok) {
      throw new Error(`Trade fetch failed (${response.status})`)
    }

    const data: TradeFetchResponse = await response.json()
    results.push(...data.result)
  }

  return results
}

export interface TradeStaticEntry {
  id: string
  text: string
  type: string
}

export interface TradeStaticGroup {
  id: string
  label: string
  entries: TradeStaticEntry[]
}

export async function fetchTradeStaticData(): Promise<TradeStaticGroup[]> {
  const url = `${POE_TRADE_API}/data/stats`
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'PoE2SyncCompanion/0.1.0 (contact: your@email.com)',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch static data (${response.status})`)
  }

  const data = await response.json()
  return data.result as TradeStaticGroup[]
}

const knownStatCache = new Map<string, TradeStaticEntry>()

export async function findStatId(
  textPattern: string,
): Promise<TradeStaticEntry | null> {
  if (knownStatCache.size === 0) {
    const groups = await fetchTradeStaticData()
    for (const group of groups) {
      for (const entry of group.entries) {
        const key = entry.text.replace(/#/g, '').trim().toLowerCase()
        knownStatCache.set(key, entry)
      }
    }
  }

  const normalized = textPattern.replace(/#/g, '').trim().toLowerCase()
  for (const [key, entry] of knownStatCache) {
    if (key.includes(normalized) || normalized.includes(key)) {
      return entry
    }
  }
  return null
}
