/**
 * App.tsx — Root component for PoE2 SyncCompanion
 *
 * Manages global app state (auth, build file, active character, active tab)
 * and renders the two main screens: LoginScreen and Dashboard.
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Sword, ArrowLeft } from 'lucide-react'
import LoginScreen from '@/components/LoginScreen'
import Dashboard from '@/components/Dashboard'
import BuildCompareTab from '@/components/tabs/BuildCompareTab'
import type { AppState } from '@/types/app'

function App() {
  const { i18n } = useTranslation()

  // ── Global App State ────────────────────────────────────────────────────────
  const [appState, setAppState] = useState<AppState>({
    isAuthenticated: false,
    accessToken: null,
    syncMode: 'mock',
    accountName: null,
    selectedCharacter: null,
    buildFile: null,
    lastSyncAt: null,
    language: 'pt-BR',
  })

  const [showCompare, setShowCompare] = useState(false)

  // ── Auth callback (called after OAuth2 success or public profile import) ───
  const handleAuthSuccess = useCallback((
    token: string | null,
    syncMode: AppState['syncMode'],
    accountName: string | null
  ) => {
    setAppState(prev => ({
      ...prev,
      isAuthenticated: true,
      accessToken: token,
      syncMode,
      accountName,
    }))
  }, [])

  // ── Build file loaded callback ──────────────────────────────────────────────
  const handleBuildLoaded = useCallback((build: AppState['buildFile']) => {
    setAppState(prev => ({ ...prev, buildFile: build }))
  }, [])

  // ── Character selection callback ────────────────────────────────────────────
  const handleCharacterSelected = useCallback((char: AppState['selectedCharacter']) => {
    setAppState(prev => ({ ...prev, selectedCharacter: char }))
  }, [])

  // ── Language toggle ─────────────────────────────────────────────────────────
  const handleLanguageToggle = useCallback(() => {
    const next = appState.language === 'pt-BR' ? 'en' : 'pt-BR'
    setAppState(prev => ({ ...prev, language: next }))
    i18n.changeLanguage(next)
  }, [appState.language, i18n])

  // ── Sync timestamp updater ──────────────────────────────────────────────────
  const handleSyncComplete = useCallback((updatedChar?: AppState['selectedCharacter']) => {
    setAppState(prev => ({
      ...prev,
      selectedCharacter: updatedChar ?? prev.selectedCharacter,
      lastSyncAt: new Date(),
    }))
  }, [])

  if (showCompare) {
    return (
      <div className="min-h-screen bg-poe-bg flex flex-col">
        <header className="flex items-center justify-between px-8 py-5 border-b border-poe-border">
          <div className="flex items-center gap-3">
            <Sword className="w-7 h-7 text-poe-gold" />
            <span className="font-display text-poe-gold text-xl tracking-widest">PoE2 SyncCompanion</span>
          </div>
          <button
            onClick={() => setShowCompare(false)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-poe-border text-poe-muted hover:text-poe-text hover:border-poe-gold/40 transition-all duration-200 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            {i18n.language === 'pt-BR' ? 'Voltar' : 'Back'}
          </button>
        </header>
        <main className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto px-6 py-6">
            <BuildCompareTab />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="app-root">
      {!appState.isAuthenticated || !appState.buildFile || !appState.selectedCharacter ? (
        <LoginScreen
          appState={appState}
          onAuthSuccess={handleAuthSuccess}
          onBuildLoaded={handleBuildLoaded}
          onCharacterSelected={handleCharacterSelected}
          onLanguageToggle={handleLanguageToggle}
          onOpenCompare={() => setShowCompare(true)}
        />
      ) : (
        <Dashboard
          appState={appState}
          onSyncComplete={handleSyncComplete}
          onLanguageToggle={handleLanguageToggle}
          onLogout={() =>
            setAppState(prev => ({
              ...prev,
              isAuthenticated: false,
              accessToken: null,
              syncMode: 'mock',
              accountName: null,
              selectedCharacter: null,
              buildFile: null,
            }))
          }
        />
      )}
    </div>
  )
}

export default App
