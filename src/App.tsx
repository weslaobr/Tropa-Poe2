/**
 * App.tsx — Root component for PoE2 SyncCompanion
 *
 * Manages global app state (auth, build file, active character, active tab)
 * and renders the two main screens: LoginScreen and Dashboard.
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import LoginScreen from '@/components/LoginScreen'
import Dashboard from '@/components/Dashboard'
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

  return (
    <div className="app-root">
      {!appState.isAuthenticated || !appState.buildFile || !appState.selectedCharacter ? (
        <LoginScreen
          appState={appState}
          onAuthSuccess={handleAuthSuccess}
          onBuildLoaded={handleBuildLoaded}
          onCharacterSelected={handleCharacterSelected}
          onLanguageToggle={handleLanguageToggle}
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
