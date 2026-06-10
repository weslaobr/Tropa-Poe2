/// <reference types="vite/client" />
/**
 * components/Dashboard.tsx — Main Build Tracking Dashboard
 *
 * Shows overall progress bar + 3 tabs: Passives, Gems, Stats.
 * Runs automatic sync every 60s and supports manual sync.
 */

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  RefreshCw, LogOut, Globe, Sword, GitCompare,
  Network, Gem, BarChart3,
} from 'lucide-react'
import type { AppState, BuildDiffResult } from '@/types/app'
import { runBuildDiff } from '@/lib/buildDiff'
import { fetchPublicCharacterDetails, fetchCharacterDetails } from '@/lib/gggApi'
import PassivesTab from '@/components/tabs/PassivesTab'
import GemsTab     from '@/components/tabs/GemsTab'
import StatsTab    from '@/components/tabs/StatsTab'

const SYNC_INTERVAL_MS = 300_000 // 5 minutos

interface DashboardProps {
  appState:         AppState
  onSyncComplete:   (updatedChar?: AppState['selectedCharacter']) => void
  onLanguageToggle: () => void
  onLogout:         () => void
}

type Tab = 'passives' | 'gems' | 'stats'

export default function Dashboard({
  appState,
  onSyncComplete,
  onLanguageToggle,
  onLogout,
}: DashboardProps) {
  const { t } = useTranslation()

  const [activeTab,  setActiveTab]  = useState<Tab>('passives')
  const [isSyncing,  setIsSyncing]  = useState(false)
  const [diffResult, setDiffResult] = useState<BuildDiffResult | null>(null)

  // ── Sync function ────────────────────────────────────────────────────────
  const runSync = useCallback(async () => {
    if (isSyncing || !appState.buildFile || !appState.selectedCharacter) return
    setIsSyncing(true)

    try {
      let updatedChar = { ...appState.selectedCharacter }

      // Fetch fresh data when running inside Tauri or production environment
      const isTauri = typeof window !== 'undefined' && '__TAURI__' in window
      if (isTauri || import.meta.env.MODE === 'production') {
        try {
          if (appState.syncMode === 'public' && appState.accountName) {
            updatedChar = await fetchPublicCharacterDetails(appState.accountName, appState.selectedCharacter.name)
          } else if (
            appState.syncMode === 'oauth' &&
            appState.accessToken &&
            !appState.accessToken.startsWith('mock_')
          ) {
            updatedChar = await fetchCharacterDetails(appState.accessToken, appState.selectedCharacter.name)
          }
        } catch (e) {
          console.error('Failed to fetch character during sync, using local data:', e)
        }
      } else {
        // Mock sync delay in web development mode
        await new Promise(r => setTimeout(r, 1000))
      }

      const result = runBuildDiff(appState.buildFile, updatedChar)
      setDiffResult(result)
      onSyncComplete(updatedChar)
    } catch (err) {
      console.error('Sync diff execution error:', err)
    } finally {
      setIsSyncing(false)
    }
  }, [appState.buildFile, appState.selectedCharacter, appState.syncMode, appState.accountName, appState.accessToken, isSyncing, onSyncComplete])

  // ── Initial sync + periodic auto-sync ───────────────────────────────────
  useEffect(() => {
    runSync()
    const interval = setInterval(runSync, SYNC_INTERVAL_MS)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Run once on mount; runSync stable ref is fine here

  // ── Tab definitions ───────────────────────────────────────────────────────
  const tabs = [
    { id: 'passives' as Tab, label: t('dashboard.tabs.passives'), Icon: Network    },
    { id: 'gems'     as Tab, label: t('dashboard.tabs.gems'),     Icon: Gem        },
    { id: 'stats'    as Tab, label: t('dashboard.tabs.stats'),    Icon: BarChart3  },
  ]

  const char  = appState.selectedCharacter!
  const build = appState.buildFile!

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-poe-bg flex flex-col">
      {/* ── Top Bar ── */}
      <header className="flex items-center gap-4 px-6 py-4 border-b border-poe-border bg-poe-surface">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-4">
          <Sword className="w-5 h-5 text-poe-gold" />
          <span className="font-display text-poe-gold text-base tracking-widest hidden sm:inline">
            PoE2 SyncCompanion
          </span>
        </div>

        {/* Character info */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-poe-elevated border border-poe-border">
          <GitCompare className="w-4 h-4 text-poe-gold" />
          <span className="text-poe-text text-sm font-medium">{char.name}</span>
          <span className="text-poe-muted text-xs">
            {char.class} · Lv.{char.level} · {char.league}
          </span>
        </div>

        <div className="flex-1" />

        {/* Last sync time */}
        {appState.lastSyncAt && (
          <span className="text-poe-subtle text-xs hidden md:inline">
            {t('dashboard.header.lastSync')}{' '}
            {appState.lastSyncAt.toLocaleTimeString()}
          </span>
        )}

        {/* Sync button */}
        <button
          id="btn-sync"
          onClick={runSync}
          disabled={isSyncing}
          className="btn-secondary flex items-center gap-2 text-sm py-1.5 px-3"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">
            {isSyncing ? t('dashboard.header.syncing') : t('dashboard.header.sync')}
          </span>
        </button>

        {/* Language toggle */}
        <button
          onClick={onLanguageToggle}
          className="btn-ghost p-2"
          title={t('language.current')}
        >
          <Globe className="w-4 h-4" />
        </button>

        {/* Logout */}
        <button
          id="btn-logout"
          onClick={onLogout}
          className="btn-ghost p-2 hover:text-poe-crimson-bright"
          title={t('dashboard.header.logout')}
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* ── Progress section ── */}
      <div className="px-6 py-5 border-b border-poe-border bg-poe-surface">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-poe-gold font-display text-lg tracking-wide">
                {t('dashboard.progress.title')}
              </h2>
              <p className="text-poe-muted text-xs mt-0.5">
                {build.fileName} · {char.class} Lv.{char.level}
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-poe-gold font-display">
                {diffResult?.overallProgress ?? 0}%
              </span>
              <p className="text-poe-muted text-xs">{t('dashboard.progress.complete')}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="relative h-3 rounded-full bg-poe-elevated overflow-hidden border border-poe-border">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${diffResult?.overallProgress ?? 0}%`,
                background: 'linear-gradient(90deg, #8a7030 0%, #c8a84b 50%, #e8c86a 100%)',
                boxShadow: '0 0 8px rgba(200,168,75,0.5)',
              }}
            />
            {/* Shimmer overlay */}
            <div
              className="absolute inset-0 animate-shimmer"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
              }}
            />
          </div>

          {/* Sub-scores */}
          {diffResult && (
            <div className="flex gap-6 mt-3">
              <MiniProgress
                label={t('dashboard.tabs.passives')}
                value={Math.round((diffResult.passiveDiff.totalAllocated / Math.max(1, diffResult.passiveDiff.totalPlanned)) * 100)}
              />
              <MiniProgress
                label={t('dashboard.tabs.gems')}
                value={Math.round((diffResult.gemDiff.links.reduce((s,l) => s + l.correctGems.length, 0) /
                         Math.max(1, diffResult.gemDiff.links.reduce((s,l) => s + l.planned.length, 0))) * 100)}
              />
              <MiniProgress
                label={t('dashboard.tabs.stats')}
                value={Math.round(
                  (Object.values(diffResult.statDiff.delta).filter(d => (d ?? 0) >= 0).length /
                   Math.max(1, Object.keys(diffResult.statDiff.delta).length)) * 100,
                )}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="border-b border-poe-border bg-poe-surface">
        <div className="max-w-4xl mx-auto px-6">
          <nav className="flex gap-1">
            {tabs.map(({ id, label, Icon }) => (
              <button
                key={id}
                id={`tab-${id}`}
                onClick={() => setActiveTab(id)}
                className={`
                  flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all duration-200
                  border-b-2 -mb-px
                  ${activeTab === id
                    ? 'border-poe-gold text-poe-gold'
                    : 'border-transparent text-poe-muted hover:text-poe-text hover:border-poe-border'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ── Tab Content ── */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 py-6 animate-fade-in">
          {!diffResult ? (
            <LoadingState />
          ) : (
            <>
              {activeTab === 'passives' && (
                <PassivesTab diff={diffResult.passiveDiff} />
              )}
              {activeTab === 'gems' && (
                <GemsTab diff={diffResult.gemDiff} />
              )}
              {activeTab === 'stats' && (
                <StatsTab diff={diffResult.statDiff} characterLevel={char.level} />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function MiniProgress({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-poe-muted">{label}:</span>
      <div className="w-20 h-1.5 rounded-full bg-poe-elevated overflow-hidden">
        <div
          className="h-full rounded-full bg-poe-gold/70 transition-all duration-700"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-poe-text font-mono">{value}%</span>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-2 border-poe-gold/20 border-t-poe-gold animate-spin" />
      </div>
      <p className="text-poe-muted text-sm">Syncing character data...</p>
    </div>
  )
}
