import {
  searchTrade,
  fetchTradeItems,
  findStatId,
  type TradeStatFilter,
  type TradeSearchRequest,
  type TradeFetchItem,
} from './tradeApi'

export interface DesiredStat {
  label: string
  text: string
  min: number
  max?: number
  priority: 'essential' | 'high' | 'medium' | 'low'
}

export interface TradeResult {
  item: TradeFetchItem
  score: number
  matchDetails: { label: string; actual: number; desired: number }[]
}

export interface FuzzySearchProgress {
  attempt: number
  description: string
  totalResults: number
  isFinal: boolean
}

export interface FuzzySearchResult {
  items: TradeResult[]
  progress: FuzzySearchProgress[]
  relaxed: boolean
  finalDescription: string
}

function extractNumericValue(modText: string): number | null {
  const match = modText.match(/[+-]?[\d,.]+/)
  if (!match) return null
  return parseFloat(match[0].replace(/,/g, ''))
}

function modMatchesLabel(modText: string, label: string): boolean {
  const normalized = modText.toLowerCase().replace(/#/g, '')
  const labelNorm = label.toLowerCase().replace(/#/g, '').replace(/\([^)]*\)/g, '').trim()
  return normalized.includes(labelNorm) || labelNorm.includes(normalized.slice(0, 20))
}

function calculateItemScore(
  item: TradeFetchItem,
  desiredStats: DesiredStat[],
): TradeResult['matchDetails'] {
  const allMods = [
    ...(item.item.explicitMods ?? []),
    ...(item.item.implicitMods ?? []),
    ...(item.item.runeMods ?? []),
    ...(item.item.craftedMods ?? []),
    ...(item.item.fracturedMods ?? []),
  ]

  return desiredStats.map(stat => {
    let bestValue = 0
    for (const mod of allMods) {
      if (modMatchesLabel(mod, stat.label)) {
        const val = extractNumericValue(mod)
        if (val !== null) {
          if (val > bestValue) bestValue = val
        }
      }
    }
    return {
      label: stat.label,
      actual: bestValue,
      desired: stat.min,
    }
  })
}

function computeOverallScore(details: TradeResult['matchDetails']): number {
  if (details.length === 0) return 0
  const ratios = details.map(d => d.desired > 0 ? Math.min(d.actual / d.desired, 1) : 1)
  return Math.round(ratios.reduce((a, b) => a + b, 0) / ratios.length * 100)
}

function buildSearchQuery(
  stats: DesiredStat[],
  relaxationLevel: number,
): TradeSearchRequest {
  const filters: TradeStatFilter[] = []

  for (const stat of stats) {
    const relaxedMin = stat.min * (1 - relaxationLevel * 0.15)
    const relaxedMax = stat.max ? stat.max * (1 + relaxationLevel * 0.1) : undefined
    filters.push({
      id: stat.text,
      value: {
        min: Math.round(relaxedMin),
        ...(relaxedMax ? { max: Math.round(relaxedMax) } : {}),
      },
    })
  }

  return {
    query: {
      status: { option: 'online' },
      stats: [
        {
          type: 'and',
          filters,
        },
      ],
      filters: {
        type_filters: {
          filters: {},
        },
      },
    },
    sort: { price: 'asc' },
  }
}

export async function fuzzySearch(
  desiredStats: DesiredStat[],
  league: string,
  onProgress?: (progress: FuzzySearchProgress) => void,
): Promise<FuzzySearchResult> {
  const progress: FuzzySearchProgress[] = []
  const essentialStats = desiredStats.filter(s => s.priority === 'essential')
  const nonEssential = desiredStats.filter(s => s.priority !== 'essential')

  async function trySearch(statsToUse: DesiredStat[], level: number): Promise<FuzzySearchResult | null> {
    const resolved = await resolveStatIds(statsToUse)
    if (!resolved) return null

    const query = buildSearchQuery(resolved, level)
    const desc = level === 0
      ? 'Buscando com stats exatos...'
      : `Relaxando busca (nível ${level}, valores reduzidos ${level * 15}%)...`

    const p: FuzzySearchProgress = {
      attempt: level,
      description: desc,
      totalResults: 0,
      isFinal: false,
    }
    progress.push(p)
    onProgress?.(p)

    try {
      const searchResult = await searchTrade(league, query)
      p.totalResults = searchResult.total

      if (searchResult.total > 0) {
        const itemIds = searchResult.result.slice(0, 20)
        const items = await fetchTradeItems(itemIds, searchResult.id)
        const results = items.map(item => {
          const details = calculateItemScore(item, desiredStats)
          const score = computeOverallScore(details)
          return { item, score, matchDetails: details }
        })
        results.sort((a, b) => b.score - a.score)

        const finalP: FuzzySearchProgress = { ...p, isFinal: true }
        progress[progress.length - 1] = finalP

        return {
          items: results,
          progress: [...progress],
          relaxed: level > 0,
          finalDescription: level === 0
            ? `${searchResult.total} itens encontrados com stats exatos!`
            : `Nenhum item exato encontrado. Mostrando ${searchResult.total} itens próximos (nível ${level} de relaxamento).`,
        }
      }
    } catch (err) {
      console.error(`Search attempt ${level} failed:`, err)
    }

    return null
  }

  let result: FuzzySearchResult | null = null

  for (let level = 0; level <= 5; level++) {
    result = await trySearch(desiredStats, level)
    if (result) return result
  }

  if (nonEssential.length > 0) {
    for (let i = 0; i < nonEssential.length; i++) {
      const reduced = [...essentialStats, ...nonEssential.slice(0, nonEssential.length - 1 - i)]
      for (let level = 0; level <= 3; level++) {
        result = await trySearch(reduced, level)
        if (result) {
          result.finalDescription = `Nenhum item com todos os stats. Mostrando resultados ignorando "${nonEssential[nonEssential.length - 1 - i].label}"`
          return result
        }
      }
    }
  }

  return {
    items: [],
    progress,
    relaxed: true,
    finalDescription: 'Nenhum item encontrado mesmo após relaxar todos os filtros.',
  }
}

async function resolveStatIds(stats: DesiredStat[]): Promise<DesiredStat[] | null> {
  const resolved: DesiredStat[] = []
  for (const stat of stats) {
    const entry = await findStatId(stat.text)
    if (entry) {
      resolved.push({ ...stat, text: entry.id })
    } else {
      resolved.push(stat)
    }
  }
  return resolved
}
