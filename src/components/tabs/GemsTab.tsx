/**
 * components/tabs/GemsTab.tsx — Gems & Links Comparison Tab
 *
 * Displays each gem link group from the build plan and compares against
 * what the character currently has equipped.
 *
 * Gem names are displayed in English — NOT translated (API/build file strings).
 */

import { useTranslation } from 'react-i18next'
import { CheckCircle2, XCircle, AlertTriangle, Gem } from 'lucide-react'
import type { GemDiff, GemLinkDiff, PlannedGem, ActiveGem } from '@/types/app'

interface GemsTabProps {
  diff: GemDiff
}

export default function GemsTab({ diff }: GemsTabProps) {
  const { t } = useTranslation()

  const totalPlanned = diff.links.reduce((s, l) => s + l.planned.length, 0)
  const totalCorrect = diff.links.reduce((s, l) => s + l.correctGems.length, 0)
  const totalMissing = diff.links.reduce((s, l) => s + l.missingGems.length, 0)
  const totalUnder   = diff.links.reduce((s, l) => s + l.underleveledGems.length, 0)

  return (
    <div className="space-y-6 animate-slide-up">
      {/* ── Summary row ── */}
      <div className="grid grid-cols-4 gap-3">
        <SummaryCard label="Total" value={totalPlanned} color="neutral" />
        <SummaryCard label={t('dashboard.gems.ok')}          value={totalCorrect} color="success" />
        <SummaryCard label={t('dashboard.gems.underleveled')} value={totalUnder}   color="warning" />
        <SummaryCard label={t('dashboard.gems.missing')}      value={totalMissing} color="danger"  />
      </div>

      {/* ── Link groups ── */}
      <div className="space-y-5">
        {diff.links.map(linkGroup => (
          <GemLinkGroup key={linkGroup.groupLabel} group={linkGroup} />
        ))}
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: 'neutral' | 'success' | 'warning' | 'danger'
}) {
  const colorMap = {
    neutral: 'border-poe-border text-poe-text',
    success: 'border-poe-success/40 text-green-400',
    warning: 'border-poe-warning/40 text-yellow-400',
    danger:  'border-poe-crimson/40 text-red-400',
  }

  return (
    <div className={`rounded-xl p-4 border bg-poe-panel text-center ${colorMap[color]}`}>
      <div className="text-2xl font-bold font-display mb-1">{value}</div>
      <div className="text-poe-muted text-xs">{label}</div>
    </div>
  )
}

function GemLinkGroup({ group }: { group: GemLinkDiff }) {
  const { t } = useTranslation()
  const statusColor =
    group.missingGems.length > 0 ? 'border-poe-crimson/40' :
    group.underleveledGems.length > 0 ? 'border-poe-warning/40' :
    'border-poe-success/30'

  return (
    <div className={`rounded-xl border bg-poe-panel overflow-hidden ${statusColor}`}>
      {/* Group header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-poe-border bg-poe-elevated">
        <Gem className="w-4 h-4 text-poe-gold" />
        {/* Group label kept in English (e.g. "Main Skill") */}
        <span className="text-poe-text font-medium text-sm">{group.groupLabel}</span>
        <div className="ml-auto flex items-center gap-3 text-xs">
          {group.missingGems.length > 0 && (
            <span className="flex items-center gap-1 text-red-400">
              <XCircle className="w-3.5 h-3.5" />
              {group.missingGems.length} {t('dashboard.gems.missing')}
            </span>
          )}
          {group.underleveledGems.length > 0 && (
            <span className="flex items-center gap-1 text-yellow-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              {group.underleveledGems.length} {t('dashboard.gems.underleveled')}
            </span>
          )}
          {group.missingGems.length === 0 && group.underleveledGems.length === 0 && (
            <span className="flex items-center gap-1 text-green-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t('dashboard.gems.ok')}
            </span>
          )}
        </div>
      </div>

      {/* Gem rows */}
      <div className="divide-y divide-poe-border">
        {group.planned.map(planned => {
          const currentGem = group.current.find(
            g => g.name.toLowerCase() === planned.name.toLowerCase(),
          )
          const underleveled = group.underleveledGems.find(
            u => u.planned.name.toLowerCase() === planned.name.toLowerCase(),
          )
          const isMissing   = group.missingGems.some(m => m.name.toLowerCase() === planned.name.toLowerCase())

          return (
            <GemRow
              key={planned.name}
              planned={planned}
              current={currentGem}
              isMissing={isMissing}
              deficitLevels={underleveled?.deficit}
            />
          )
        })}
      </div>
    </div>
  )
}

function GemRow({
  planned,
  current,
  isMissing,
  deficitLevels,
}: {
  planned:        PlannedGem
  current?:       ActiveGem
  isMissing:      boolean
  deficitLevels?: number
}) {
  const { t } = useTranslation()

  const rowBg = isMissing
    ? 'bg-poe-crimson/5'
    : deficitLevels
      ? 'bg-poe-warning/5'
      : 'bg-transparent'

  return (
    <div className={`flex items-center gap-4 px-4 py-3 hover:bg-poe-elevated/50 transition-colors ${rowBg}`}>
      {/* Status icon */}
      <div className="flex-shrink-0">
        {isMissing
          ? <XCircle       className="w-4 h-4 text-red-400" />
          : deficitLevels
            ? <AlertTriangle className="w-4 h-4 text-yellow-400" />
            : <CheckCircle2  className="w-4 h-4 text-green-400" />
        }
      </div>

      {/* Gem name (English — NOT translated) */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-poe-text text-sm font-medium truncate">{planned.name}</span>
          <span
            className={`text-xs px-1.5 py-0.5 rounded font-mono ${
              planned.isSupport
                ? 'bg-blue-900/40 text-blue-300'
                : 'bg-poe-crimson/20 text-red-300'
            }`}
          >
            {planned.isSupport ? t('dashboard.gems.support') : t('dashboard.gems.active')}
          </span>
          {!planned.isRequired && (
            <span className="text-xs text-poe-subtle">(optional)</span>
          )}
        </div>
      </div>

      {/* Current level vs required level */}
      <div className="flex items-center gap-3 text-xs flex-shrink-0">
        <div className="text-right">
          <span className="text-poe-muted">{t('dashboard.gems.current')}:</span>{' '}
          <span className={`font-mono font-bold ${current ? 'text-poe-text' : 'text-poe-subtle'}`}>
            {current ? `Lv.${current.level}` : '—'}
          </span>
        </div>
        <div className="w-px h-4 bg-poe-border" />
        <div className="text-right">
          <span className="text-poe-muted">{t('dashboard.gems.required')}:</span>{' '}
          <span className="font-mono font-bold text-poe-gold">Lv.{planned.minLevel}</span>
        </div>
        {deficitLevels && (
          <span className="text-yellow-400 text-xs ml-1">
            {t('dashboard.gems.levelDeficit', { count: deficitLevels })}
          </span>
        )}
      </div>
    </div>
  )
}
