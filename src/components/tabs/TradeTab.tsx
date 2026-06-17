import { useState, useCallback } from 'react'
import { Search, X, Plus, Loader2, AlertCircle, ExternalLink, Star } from 'lucide-react'
import { fuzzySearch, type DesiredStat, type TradeResult, type FuzzySearchProgress } from '@/lib/fuzzySearch'

interface StatInput {
  id: string
  label: string
  text: string
  min: number
  max: string
  priority: DesiredStat['priority']
}

const PRIORITY_LABELS: Record<DesiredStat['priority'], string> = {
  essential: 'Essencial',
  high: 'Alto',
  medium: 'Médio',
  low: 'Baixo',
}

const PRIORITY_COLORS: Record<DesiredStat['priority'], string> = {
  essential: 'text-red-400 border-red-700/30 bg-red-900/20',
  high: 'text-poe-gold border-poe-gold/30 bg-poe-gold/10',
  medium: 'text-yellow-400 border-yellow-700/30 bg-yellow-900/20',
  low: 'text-poe-muted border-poe-border bg-poe-elevated',
}

function createEmptyStat(): StatInput {
  return {
    id: crypto.randomUUID(),
    label: '',
    text: '',
    min: 1,
    max: '',
    priority: 'high',
  }
}

const DEFAULT_STATS: StatInput[] = [
  {
    id: '1',
    label: 'Spell Damage with Life',
    text: 'increased Spell Damage with Spells that cost Life',
    min: 148,
    max: '178',
    priority: 'high',
  },
  {
    id: '2',
    label: 'Extra Cold Damage',
    text: 'Gain % of Damage as Extra Cold Damage',
    min: 55,
    max: '60',
    priority: 'high',
  },
  {
    id: '3',
    label: 'Extra Lightning Damage',
    text: 'Gain % of Damage as Extra Lightning Damage',
    min: 49,
    max: '54',
    priority: 'high',
  },
  {
    id: '4',
    label: 'Crit Spell Damage Bonus',
    text: 'increased Critical Spell Damage Bonus',
    min: 53,
    max: '59',
    priority: 'medium',
  },
  {
    id: '5',
    label: 'Crit Chance for Spells',
    text: 'increased Critical Hit Chance for Spells',
    min: 80,
    max: '89',
    priority: 'medium',
  },
  {
    id: '6',
    label: '+Level Spell Skills',
    text: '+ to Level of all Spell Skills',
    min: 5,
    max: '',
    priority: 'essential',
  },
]

function formatPrice(price: { amount: number; currency: string } | undefined): string {
  if (!price) return '—'
  const amt = price.amount % 1 === 0 ? price.amount.toString() : price.amount.toFixed(1)
  return `${amt} ${price.currency}`
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return '<1h'
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

export default function TradeTab() {
  const [stats, setStats] = useState<StatInput[]>(DEFAULT_STATS)
  const [league, setLeague] = useState('Runes of Aldur')
  const [results, setResults] = useState<TradeResult[] | null>(null)
  const [progress, setProgress] = useState<FuzzySearchProgress[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateStat = useCallback((id: string, field: keyof StatInput, value: string | number) => {
    setStats(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
  }, [])

  const removeStat = useCallback((id: string) => {
    setStats(prev => prev.filter(s => s.id !== id))
  }, [])

  const addStat = useCallback(() => {
    setStats(prev => [...prev, createEmptyStat()])
  }, [])

  const handleSearch = useCallback(async () => {
    const validStats = stats.filter(s => s.label.trim() && s.text.trim() && s.min > 0)
    if (validStats.length === 0) {
      setError('Adicione pelo menos um stat para buscar.')
      return
    }

    setIsSearching(true)
    setError(null)
    setResults(null)
    setProgress([])

    const desiredStats: DesiredStat[] = validStats.map(s => ({
      label: s.label,
      text: s.text,
      min: s.min,
      max: s.max ? parseInt(s.max) || undefined : undefined,
      priority: s.priority,
    }))

    try {
      const result = await fuzzySearch(desiredStats, league, (p) => {
        setProgress(prev => [...prev, p])
      })
      setResults(result.items)
      setProgress(result.progress)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar itens')
    } finally {
      setIsSearching(false)
    }
  }, [stats, league])

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-poe-gold font-display text-lg tracking-wide">
          Busca Inteligente de Itens
        </h2>
        <p className="text-poe-muted text-xs mt-0.5">
          Define os stats desejados — se não achar exato, encontra o mais próximo
        </p>
      </div>

      <div className="card p-4 space-y-4">
        <div className="flex items-center gap-3">
          <label className="label-field mb-0">Liga</label>
          <input
            type="text"
            value={league}
            onChange={e => setLeague(e.target.value)}
            className="input-poe flex-1 max-w-xs"
            placeholder="Ex: Runes of Aldur"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="label-field mb-0">Stats Desejados</span>
            <button onClick={addStat} className="btn-ghost text-xs gap-1 py-1 px-2">
              <Plus className="w-3 h-3" /> Adicionar Stat
            </button>
          </div>

          {stats.map((stat, index) => (
            <div key={stat.id} className="flex items-center gap-2 bg-poe-elevated rounded-lg p-2.5 border border-poe-border">
              <span className="text-poe-subtle text-xs font-mono w-5">{index + 1}</span>
              <input
                type="text"
                value={stat.label}
                onChange={e => updateStat(stat.id, 'label', e.target.value)}
                className="input-poe flex-1 min-w-[120px]"
                placeholder="Label (ex: Spell Dmg)"
              />
              <input
                type="text"
                value={stat.text}
                onChange={e => updateStat(stat.id, 'text', e.target.value)}
                className="input-poe flex-[2] min-w-[200px]"
                placeholder="Texto do mod (ex: increased Spell Damage)"
              />
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={stat.min}
                  onChange={e => updateStat(stat.id, 'min', parseInt(e.target.value) || 0)}
                  className="input-poe w-16 text-center"
                  min={0}
                />
                {stat.max !== '' && <span className="text-poe-muted text-xs">—</span>}
                <input
                  type="number"
                  value={stat.max}
                  onChange={e => updateStat(stat.id, 'max', e.target.value)}
                  className="input-poe w-16 text-center"
                  placeholder="max"
                  min={0}
                />
              </div>
              <select
                value={stat.priority}
                onChange={e => updateStat(stat.id, 'priority', e.target.value)}
                className={`select-poe w-24 text-xs ${PRIORITY_COLORS[stat.priority]}`}
              >
                {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <button
                onClick={() => removeStat(stat.id)}
                className="btn-ghost p-1.5 text-poe-muted hover:text-poe-crimson-bright"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
        >
          {isSearching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          {isSearching ? 'Buscando...' : 'Buscar Itens no Mercado'}
        </button>
      </div>

      {error && (
        <div className="card border-poe-crimson/50 p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-poe-crimson-bright shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {progress.length > 0 && isSearching && (
        <div className="card p-4 space-y-2">
          <h3 className="text-poe-gold font-display text-sm tracking-wide">Progresso da Busca</h3>
          {progress.map((p, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <div className={`w-2 h-2 rounded-full ${p.isFinal ? 'bg-poe-success' : 'bg-poe-gold animate-pulse'}`} />
              <span className="text-poe-text">{p.description}</span>
              {p.totalResults > 0 && (
                <span className="text-poe-muted text-xs">{p.totalResults} resultados</span>
              )}
            </div>
          ))}
        </div>
      )}

      {results !== null && !isSearching && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-poe-gold font-display text-base tracking-wide">
                Resultados
              </h3>
              <p className="text-poe-muted text-xs">
                {results.length > 0
                  ? `Ordenado por proximidade dos stats ideais`
                  : 'Nenhum item encontrado'}
              </p>
            </div>
            {results.length > 0 && (
              <a
                href={`https://www.pathofexile.com/trade2/search/poe2/${encodeURIComponent(league)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost text-xs gap-1"
              >
                <ExternalLink className="w-3 h-3" /> Abrir no Site
              </a>
            )}
          </div>

          {results.slice(0, 20).map((result, i) => (
            <div key={result.item.id} className="card p-3.5 hover:border-poe-gold/30 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-poe-subtle text-xs font-mono">{i + 1}</span>
                  <div className="min-w-0">
                    <p className="text-poe-text text-sm font-medium truncate">
                      {result.item.item.name || result.item.item.typeLine}
                    </p>
                    <p className="text-poe-muted text-xs truncate">{result.item.item.typeLine}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <div className="flex items-center gap-1 bg-poe-gold/10 rounded-full px-2 py-0.5 border border-poe-gold/20">
                    <Star className="w-3 h-3 text-poe-gold" />
                    <span className="text-poe-gold text-xs font-bold">{result.score}%</span>
                  </div>
                  <span className="text-poe-text text-xs font-mono">
                    {formatPrice(result.item.listing.price)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-2">
                {result.matchDetails.map((d, j) => (
                  <div key={j} className="flex items-center gap-1.5 text-xs">
                    <span className="text-poe-muted truncate">{d.label}:</span>
                    <span className={`font-mono ${d.actual >= d.desired ? 'text-poe-success' : 'text-yellow-400'}`}>
                      {d.actual}
                    </span>
                    <span className="text-poe-subtle">/ {d.desired}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 text-xs text-poe-subtle border-t border-poe-border pt-2 mt-1">
                <span>ilvl {result.item.item.ilvl}</span>
                <span>{result.item.listing.account.name}</span>
                <span>{formatTimeAgo(result.item.listing.indexed)}</span>
                {result.item.item.corrupted && (
                  <span className="text-poe-crimson-bright">Corrompido</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
