/**
 * components/LoginScreen.tsx — Authentication & Setup Screen
 *
 * Step-by-step onboarding: GGG OAuth2 → Load .build file → Select character.
 * Shows a premium PoE-themed dark landing with guided steps.
 */

import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Shield, Upload, ChevronDown, Sword, Loader2,
  CheckCircle2, AlertCircle, Globe, User,
} from 'lucide-react'
import type { AppState, GGGCharacter, BuildFile } from '@/types/app'
import { parseBuildFile } from '@/lib/buildParser'
import { MOCK_BUILD_FILE, MOCK_CHARACTER } from '@/lib/mockData'

interface LoginScreenProps {
  appState:             AppState
  onAuthSuccess:        (token: string) => void
  onBuildLoaded:        (build: BuildFile) => void
  onCharacterSelected:  (char: GGGCharacter) => void
  onLanguageToggle:     () => void
}

export default function LoginScreen({
  appState,
  onAuthSuccess,
  onBuildLoaded,
  onCharacterSelected,
  onLanguageToggle,
}: LoginScreenProps) {
  const { t } = useTranslation()

  // ── Local state ────────────────────────────────────────────────────────────
  const [isAuthenticating,  setIsAuthenticating]  = useState(false)
  const [authError,         setAuthError]          = useState<string | null>(null)
  const [characters,        setCharacters]          = useState<GGGCharacter[]>([])
  const [isLoadingChars,    setIsLoadingChars]     = useState(false)
  const [selectedChar,      setSelectedChar]       = useState<string>('')
  const [buildFileName,     setBuildFileName]      = useState<string | null>(null)
  const [buildError,        setBuildError]         = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Derived step completion state ──────────────────────────────────────────
  const step1Done = appState.isAuthenticated
  const step2Done = appState.buildFile !== null
  const step3Done = appState.selectedCharacter !== null
  const canStart  = step1Done && step2Done && step3Done

  // ── Handlers ───────────────────────────────────────────────────────────────

  /** Simulates OAuth2 — in production, opens browser via Tauri shell plugin */
  async function handleAuth() {
    setIsAuthenticating(true)
    setAuthError(null)
    try {
      // MOCK: Simulate OAuth2 delay then succeed
      await new Promise(r => setTimeout(r, 1800))
      onAuthSuccess('mock_access_token_' + Date.now())

      // After auth, load character list
      setIsLoadingChars(true)
      await new Promise(r => setTimeout(r, 800))
      setCharacters([MOCK_CHARACTER])
    } catch {
      setAuthError(t('login.auth.error'))
    } finally {
      setIsAuthenticating(false)
      setIsLoadingChars(false)
    }
  }

  /** Reads the selected .build file and parses it */
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBuildError(null)

    try {
      const text = await file.text()
      // Try JSON parse; if it fails with a real file, use mock for demo
      let build: BuildFile
      try {
        build = parseBuildFile(text, file.name)
      } catch {
        // If file isn't valid JSON, fall back to mock for UI demonstration
        build = { ...MOCK_BUILD_FILE, fileName: file.name }
      }
      setBuildFileName(file.name)
      onBuildLoaded(build)
    } catch (err) {
      setBuildError(err instanceof Error ? err.message : 'Unknown error')
    }

    // Reset input so the same file can be re-selected
    e.target.value = ''
  }

  /** Confirms the character selection */
  function handleCharacterConfirm(charName: string) {
    const char = characters.find(c => c.name === charName)
    if (char) onCharacterSelected(char)
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      {/* ── Top bar ── */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-poe-border">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Sword className="w-7 h-7 text-poe-gold" />
            <div className="absolute -inset-1 bg-poe-gold/10 rounded-full blur-sm" />
          </div>
          <span className="font-display text-poe-gold text-xl tracking-widest">
            PoE2 SyncCompanion
          </span>
        </div>
        <button
          onClick={onLanguageToggle}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-poe-border
                     text-poe-muted hover:text-poe-text hover:border-poe-gold/40
                     transition-all duration-200 text-sm"
        >
          <Globe className="w-4 h-4" />
          <span className="font-mono">{t('language.toggle')}</span>
        </button>
      </header>

      {/* ── Hero section ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Decorative glow orb */}
        <div className="relative mb-10">
          <div className="w-24 h-24 rounded-full bg-poe-crimson/20 flex items-center justify-center
                          shadow-crimson border border-poe-crimson/30">
            <Shield className="w-12 h-12 text-poe-gold" />
          </div>
          <div className="absolute -inset-3 bg-poe-gold/5 rounded-full blur-xl animate-pulse-gold" />
        </div>

        <h1 className="font-display text-4xl text-poe-text mb-2 text-center tracking-wide">
          {t('login.title')}
        </h1>
        <p className="text-poe-muted text-center max-w-md mb-12 leading-relaxed">
          {t('login.subtitle')}
        </p>

        {/* ── Steps card ── */}
        <div className="w-full max-w-lg space-y-4">
          {/* Step 1: Auth */}
          <StepCard
            number={1}
            label={t('login.steps.one')}
            completed={step1Done}
          >
            {!step1Done ? (
              <button
                id="btn-auth-ggg"
                onClick={handleAuth}
                disabled={isAuthenticating}
                className="w-full btn-primary flex items-center justify-center gap-3"
              >
                {isAuthenticating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />{t('login.auth.authenticating')}</>
                ) : (
                  <><Shield className="w-4 h-4" />{t('login.auth.button')}</>
                )}
              </button>
            ) : (
              <StatusBadge success label={t('login.auth.success')} />
            )}
            {authError && (
              <p className="mt-2 text-poe-crimson-bright text-sm flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{authError}
              </p>
            )}
            <p className="mt-2 text-poe-subtle text-xs">{t('login.auth.description')}</p>
          </StepCard>

          {/* Step 2: Load build */}
          <StepCard
            number={2}
            label={t('login.steps.two')}
            completed={step2Done}
            locked={!step1Done}
          >
            {!step2Done ? (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".build,.json"
                  className="hidden"
                  onChange={handleFileSelect}
                  id="file-input-build"
                />
                <button
                  id="btn-load-build"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!step1Done}
                  className="w-full btn-secondary flex items-center justify-center gap-3"
                >
                  <Upload className="w-4 h-4" />
                  {t('login.build.button')}
                </button>
              </>
            ) : (
              <StatusBadge success label={`${t('login.build.loaded')} ${buildFileName}`} />
            )}
            {buildError && (
              <p className="mt-2 text-poe-crimson-bright text-sm flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{buildError}
              </p>
            )}
            <p className="mt-2 text-poe-subtle text-xs">{t('login.build.description')}</p>
          </StepCard>

          {/* Step 3: Select character */}
          <StepCard
            number={3}
            label={t('login.steps.three')}
            completed={step3Done}
            locked={!step2Done}
          >
            {isLoadingChars ? (
              <div className="flex items-center gap-2 text-poe-muted text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('login.character.loading')}
              </div>
            ) : !step3Done ? (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-poe-muted pointer-events-none" />
                <select
                  id="select-character"
                  value={selectedChar}
                  disabled={!step2Done || characters.length === 0}
                  onChange={e => {
                    setSelectedChar(e.target.value)
                    handleCharacterConfirm(e.target.value)
                  }}
                  className="w-full select-poe pl-10"
                >
                  <option value="">{t('login.character.placeholder')}</option>
                  {characters.map(c => (
                    <option key={c.name} value={c.name}>
                      {c.name} — {c.class} {t('common.level')} {c.level} ({c.league})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-poe-muted pointer-events-none" />
              </div>
            ) : (
              <StatusBadge
                success
                label={`${appState.selectedCharacter!.name} — ${appState.selectedCharacter!.class} Lv.${appState.selectedCharacter!.level}`}
              />
            )}
          </StepCard>

          {/* CTA */}
          <div className="pt-2">
            {canStart ? (
              <div className="text-center text-poe-gold text-sm font-medium animate-pulse-gold">
                {t('login.start.hint')} ✓
              </div>
            ) : (
              <p className="text-center text-poe-subtle text-xs">{t('login.start.hint')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

interface StepCardProps {
  number:    number
  label:     string
  completed: boolean
  locked?:   boolean
  children:  React.ReactNode
}

function StepCard({ number, label, completed, locked, children }: StepCardProps) {
  return (
    <div
      className={`
        relative rounded-xl border p-5 transition-all duration-300
        ${completed
          ? 'border-poe-gold/40 bg-poe-panel shadow-gold'
          : locked
            ? 'border-poe-border bg-poe-surface opacity-50 pointer-events-none'
            : 'border-poe-border bg-poe-panel hover:border-poe-gold/30'
        }
      `}
    >
      {/* Step number badge */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`
            w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
            ${completed
              ? 'bg-poe-gold text-poe-bg'
              : 'border border-poe-muted text-poe-muted'
            }
          `}
        >
          {completed ? <CheckCircle2 className="w-4 h-4" /> : number}
        </div>
        <span className={`text-sm font-medium ${completed ? 'text-poe-gold' : 'text-poe-text'}`}>
          {label}
        </span>
      </div>
      <div className="pl-10">{children}</div>
    </div>
  )
}

function StatusBadge({ success, label }: { success: boolean; label: string }) {
  return (
    <div
      className={`flex items-center gap-2 text-sm py-2 px-3 rounded-lg ${
        success ? 'bg-poe-success/10 text-green-400 border border-poe-success/30' : ''
      }`}
    >
      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
      <span className="truncate">{label}</span>
    </div>
  )
}
