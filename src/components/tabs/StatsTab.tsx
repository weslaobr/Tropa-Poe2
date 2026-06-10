/**
 * components/tabs/StatsTab.tsx — Attributes & Resistances Comparison Tab
 *
 * Compares current character stats vs. build targets.
 * Stat labels are translated (UI strings), values/numbers are raw.
 * Resistance cap of 75% is highlighted for PoE 2 end-game relevance.
 */

import { useTranslation } from 'react-i18next'
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react'
import type { StatDiff, CharacterStats } from '@/types/app'

interface StatsTabProps {
  diff:           StatDiff
  characterLevel: number
}

// ── Grouping config ──────────────────────────────────────────────────────────

interface StatGroupConfig {
  label: string
  key:   string
  stats: (keyof CharacterStats)[]
}

const STAT_GROUPS: StatGroupConfig[] = [
  {
    label: 'attributes',
    key:   'attributes',
    stats: ['strength', 'dexterity', 'intelligence'],
  },
  {
    label: 'defenses',
    key:   'defenses',
    stats: ['life', 'mana', 'energyShield'],
  },
  {
    label: 'resistances',
    key:   'resistances',
    stats: ['resistFire', 'resistCold', 'resistLightning', 'resistChaos'],
  },
]

export default function StatsTab({ diff, characterLevel }: StatsTabProps) {
  const { t } = useTranslation()

  const metCount     = Object.values(diff.delta).filter(d => (d ?? 0) >= 0).length
  const totalStats   = Object.keys(diff.delta).length
  const metPct       = Math.round((metCount / Math.max(1, totalStats)) * 100)

  return (
    <div className="space-y-6 animate-slide-up">
      {/* ── Summary ── */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-poe-border bg-poe-panel">
        <div>
          <p className="text-poe-text font-medium">{t('dashboard.stats.title')}</p>
          <p className="text-poe-muted text-xs mt-0.5">
            {t('dashboard.stats.subtitle')} · Lv.{characterLevel}
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold font-display text-poe-gold">{metPct}%</span>
          <p className="text-poe-muted text-xs">
            {metCount}/{totalStats} {t('dashboard.stats.met')}
          </p>
        </div>
      </div>

      {/* ── Stat groups ── */}
      {STAT_GROUPS.map(group => (
        <StatGroup
          key={group.key}
          groupKey={group.key}
          stats={group.stats}
          diff={diff}
        />
      ))}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatGroup({
  groupKey,
  stats,
  diff,
}: {
  groupKey: string
  stats:    (keyof CharacterStats)[]
  diff:     StatDiff
}) {
  const { t } = useTranslation()

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4 text-poe-gold" />
        <h3 className="text-poe-text font-medium text-sm">
          {t(`dashboard.stats.${groupKey}`)}
        </h3>
      </div>

      <div className="rounded-xl border border-poe-border bg-poe-panel overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-4 gap-4 px-4 py-2.5 border-b border-poe-border bg-poe-elevated
                        text-xs text-poe-muted uppercase tracking-wider">
          <span>Stat</span>
          <span className="text-right">{t('dashboard.stats.current')}</span>
          <span className="text-right">{t('dashboard.stats.target')}</span>
          <span className="text-right">{t('dashboard.stats.delta')}</span>
        </div>

        {/* Stat rows */}
        <div className="divide-y divide-poe-border">
          {stats.map(key => (
            <StatRow key={key} statKey={key} diff={diff} />
          ))}
        </div>
      </div>
    </section>
  )
}

function StatRow({
  statKey,
  diff,
}: {
  statKey: keyof CharacterStats
  diff:    StatDiff
}) {
  const { t } = useTranslation()

  const current = diff.current[statKey] ?? 0
  const target  = diff.target[statKey]  ?? 0
  const delta   = diff.delta[statKey]   ?? 0
  const isMet   = delta >= 0

  // Special: resistance cap indicator at 75%
  const isResistance = statKey.startsWith('resist')
  const isResistCapped = isResistance && current >= 75

  // Color coding for rows with large deficits
  const rowBg = !isMet
    ? Math.abs(delta) > 100
      ? 'bg-poe-crimson/5'
      : 'bg-poe-warning/5'
    : 'bg-transparent'

  return (
    <div
      className={`grid grid-cols-4 gap-4 px-4 py-3 items-center
                  hover:bg-poe-elevated/50 transition-colors ${rowBg}`}
    >
      {/* Stat name — translated (UI string) */}
      <div className="flex items-center gap-2">
        <DeltaIcon isMet={isMet} delta={delta} />
        <span className="text-sm text-poe-text truncate">
          {t(`dashboard.stats.stats.${statKey}`)}
        </span>
        {isResistCapped && (
          <span className="text-xs text-green-400 font-mono">cap</span>
        )}
      </div>

      {/* Current value */}
      <div className="text-right">
        <span
          className={`font-mono text-sm font-medium ${
            isResistance
              ? current >= 75
                ? 'text-green-400'
                : current >= 60
                  ? 'text-yellow-400'
                  : 'text-red-400'
              : 'text-poe-text'
          }`}
        >
          {formatStatValue(statKey, current)}
        </span>
      </div>

      {/* Target value */}
      <div className="text-right">
        <span className="font-mono text-sm text-poe-gold">
          {formatStatValue(statKey, target)}
        </span>
      </div>

      {/* Delta */}
      <div className="text-right">
        <span
          className={`font-mono text-sm font-bold ${
            delta === 0 ? 'text-poe-muted'
            : isMet     ? 'text-green-400'
            :             'text-red-400'
          }`}
        >
          {delta > 0 ? '+' : ''}{formatStatValue(statKey, delta)}
        </span>
      </div>
    </div>
  )
}

function DeltaIcon({ isMet, delta }: { isMet: boolean; delta: number }) {
  if (delta === 0) return <Minus       className="w-3.5 h-3.5 text-poe-subtle flex-shrink-0" />
  if (isMet)       return <TrendingUp  className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
  return               <TrendingDown className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
}

/** Format stat values with % suffix for resistances */
function formatStatValue(key: keyof CharacterStats, value: number): string {
  if (key.startsWith('resist')) return `${value}%`
  if (key === 'dps' && value >= 1000) return `${(value / 1000).toFixed(1)}k`
  return String(value)
}
