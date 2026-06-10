/**
 * components/tabs/PassivesTab.tsx — Passive Tree Progress Tab
 *
 * Shows: summary stats, next 3 recommended nodes, full allocated/missing list.
 * Passive node names are displayed in English (as they come from the API/build).
 */

import { useTranslation } from 'react-i18next'
import { CheckCircle2, Circle, ArrowRight, Network } from 'lucide-react'
import type { PassiveDiff, PassiveNode } from '@/types/app'

interface PassivesTabProps {
  diff: PassiveDiff
}

export default function PassivesTab({ diff }: PassivesTabProps) {
  const { t } = useTranslation()
  const pct = Math.round((diff.totalAllocated / Math.max(1, diff.totalPlanned)) * 100)

  return (
    <div className="space-y-6 animate-slide-up">
      {/* ── Summary row ── */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label={t('dashboard.passives.allocated')} value={diff.totalAllocated} />
        <StatCard label={t('dashboard.passives.total')}     value={diff.totalPlanned}   />
        <StatCard label={t('dashboard.passives.progress')}  value={`${pct}%`} highlight />
      </div>

      {/* ── Next recommended ── */}
      <section>
        <SectionHeader
          Icon={ArrowRight}
          title={t('dashboard.passives.nextUp')}
          subtitle={t('dashboard.passives.subtitle')}
        />

        {diff.nextRecommended.length === 0 ? (
          <EmptyState message={t('dashboard.passives.noNext')} />
        ) : (
          <div className="space-y-3">
            {diff.nextRecommended.map((node, i) => (
              <NextNodeCard key={node.id} node={node} priority={i + 1} />
            ))}
          </div>
        )}
      </section>

      {/* ── Allocated nodes ── */}
      <section>
        <SectionHeader Icon={CheckCircle2} title={t('dashboard.passives.allocated')} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {diff.allocated.map(node => (
            <NodeRow key={node.id} node={node} status="done" />
          ))}
        </div>
      </section>

      {/* ── Missing nodes ── */}
      {diff.missing.length > 0 && (
        <section>
          <SectionHeader Icon={Circle} title="Remaining Nodes" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {diff.missing.map(node => (
              <NodeRow key={node.id} node={node} status="later" />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div
      className={`
        rounded-xl p-4 border text-center
        ${highlight
          ? 'border-poe-gold/40 bg-poe-panel shadow-gold'
          : 'border-poe-border bg-poe-panel'
        }
      `}
    >
      <div className={`text-2xl font-bold font-display mb-1 ${highlight ? 'text-poe-gold' : 'text-poe-text'}`}>
        {value}
      </div>
      <div className="text-poe-muted text-xs">{label}</div>
    </div>
  )
}

function NextNodeCard({ node, priority }: { node: PassiveNode; priority: number }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl border border-poe-gold/30 bg-poe-panel
                    hover:border-poe-gold/60 hover:shadow-gold transition-all duration-200 group">
      {/* Priority badge */}
      <div className="w-8 h-8 rounded-full bg-poe-gold/15 border border-poe-gold/40
                      flex items-center justify-center flex-shrink-0 font-bold text-poe-gold text-sm
                      group-hover:bg-poe-gold/25 transition-colors">
        {priority}
      </div>
      <div className="flex-1 min-w-0">
        {/* Node name kept in English — NOT translated */}
        <p className="text-poe-text font-medium truncate">{node.name}</p>
        {node.stats.length > 0 && (
          <ul className="mt-1.5 space-y-0.5">
            {node.stats.slice(0, 2).map((stat, i) => (
              <li key={i} className="text-poe-muted text-xs">· {stat}</li>
            ))}
          </ul>
        )}
      </div>
      <ArrowRight className="w-4 h-4 text-poe-gold/50 group-hover:text-poe-gold flex-shrink-0
                             group-hover:translate-x-0.5 transition-all" />
    </div>
  )
}

function NodeRow({ node, status }: { node: PassiveNode; status: 'done' | 'next' | 'later' }) {
  return (
    <div
      className={`
        flex items-center gap-3 p-3 rounded-lg border transition-colors duration-200
        ${status === 'done'
          ? 'border-poe-success/30 bg-poe-success/5'
          : 'border-poe-border bg-poe-elevated'
        }
      `}
    >
      {status === 'done'
        ? <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
        : <Circle       className="w-4 h-4 text-poe-subtle flex-shrink-0" />
      }
      {/* Node name kept in English */}
      <span className={`text-sm truncate ${status === 'done' ? 'text-poe-text' : 'text-poe-muted'}`}>
        {node.name}
      </span>
    </div>
  )
}

function SectionHeader({
  Icon,
  title,
  subtitle,
}: {
  Icon: React.ElementType
  title: string
  subtitle?: string
}) {
  return (
    <div className="flex items-start gap-2 mb-3">
      <Icon className="w-4 h-4 text-poe-gold mt-0.5 flex-shrink-0" />
      <div>
        <h3 className="text-poe-text font-medium text-sm">{title}</h3>
        {subtitle && <p className="text-poe-muted text-xs mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-8 text-poe-muted text-sm">
      <Network className="w-4 h-4 mr-2 text-green-400" />
      {message}
    </div>
  )
}
