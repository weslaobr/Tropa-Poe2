/// <reference types="vite/client" />
/**
 * lib/gggApi.ts — GGG API Integration Layer
 *
 * Wraps all calls to the official Path of Exile API.
 * Authentication uses OAuth2 with PKCE (desktop-safe, no client secret needed).
 *
 * Docs: https://www.pathofexile.com/developer/docs
 */

import type { GGGCharacter, ActiveGem, PassiveNode } from '@/types/app'

// ── Constants ────────────────────────────────────────────────────────────────

const POE_API_BASE  = 'https://api.pathofexile.com'
const POE_AUTH_URL  = 'https://www.pathofexile.com/oauth/authorize'
const POE_TOKEN_URL = 'https://www.pathofexile.com/oauth/token'

// Register your app at https://www.pathofexile.com/developer/docs/authorization
// Replace CLIENT_ID with your registered application's client ID.
const CLIENT_ID      = import.meta.env.VITE_GGG_CLIENT_ID ?? 'poe2-sync-companion'
const REDIRECT_URI   = 'http://localhost:1420/oauth/callback'
const SCOPES         = 'account:characters account:items'

// ── PKCE Helpers ──────────────────────────────────────────────────────────────

/** Generates a cryptographically random code verifier for PKCE */
function generateCodeVerifier(): string {
  const array = new Uint8Array(64)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/** Derives the code challenge from the verifier using SHA-256 */
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data    = encoder.encode(verifier)
  const digest  = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

// ── OAuth2 PKCE Flow ──────────────────────────────────────────────────────────

/**
 * Initiates the OAuth2 PKCE flow.
 * In Tauri, this opens the system browser via the shell plugin.
 * Returns the code verifier (must be stored securely for the token exchange).
 */
export async function initiateOAuthFlow(): Promise<{ authUrl: string; verifier: string }> {
  const verifier   = generateCodeVerifier()
  const challenge  = await generateCodeChallenge(verifier)
  const state      = generateCodeVerifier().slice(0, 16) // CSRF protection

  // Store state in sessionStorage for CSRF validation on callback
  sessionStorage.setItem('oauth_state', state)

  const params = new URLSearchParams({
    client_id:             CLIENT_ID,
    response_type:         'code',
    scope:                 SCOPES,
    redirect_uri:          REDIRECT_URI,
    state,
    code_challenge:        challenge,
    code_challenge_method: 'S256',
  })

  const authUrl = `${POE_AUTH_URL}?${params.toString()}`
  return { authUrl, verifier }
}

/**
 * Exchanges the authorization code for an access token.
 * Called after the user is redirected back to the app.
 */
export async function exchangeCodeForToken(
  code: string,
  verifier: string,
): Promise<string> {
  const response = await fetch(POE_TOKEN_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({
      client_id:     CLIENT_ID,
      grant_type:    'authorization_code',
      code,
      redirect_uri:  REDIRECT_URI,
      code_verifier: verifier,
    }).toString(),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Token exchange failed: ${err}`)
  }

  const data = await response.json() as { access_token: string }
  return data.access_token
}

// ── API Calls ─────────────────────────────────────────────────────────────────

/** Shared fetch wrapper with auth header and error handling */
async function apiFetch<T>(endpoint: string, token: string): Promise<T> {
  const response = await fetch(`${POE_API_BASE}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'User-Agent':    `PoE2SyncCompanion/0.1.0 (contact: your@email.com)`,
    },
  })

  if (!response.ok) {
    throw new Error(`GGG API error ${response.status}: ${response.statusText} [${endpoint}]`)
  }

  return response.json() as Promise<T>
}

/**
 * Fetches the list of characters on the authenticated account.
 * Endpoint: GET /character
 */
export async function fetchCharacters(token: string): Promise<GGGCharacter[]> {
  const data = await apiFetch<{ characters: GGGCharacter[] }>('/character', token)
  return data.characters ?? []
}

/**
 * Fetches full character details including items and passives.
 * Endpoint: GET /character/{name}
 */
export async function fetchCharacterDetails(
  token: string,
  characterName: string,
): Promise<GGGCharacter> {
  interface RawCharacter {
    name: string
    class: string
    league: string
    level: number
    experience: number
    equipment?: RawItem[]
    passives?: { hashes: number[] }
  }

  interface RawItem {
    id: string
    name: string
    typeLine: string
    identified: boolean
    ilvl: number
    inventoryId: string
    socketedItems?: RawSocketedGem[]
  }

  interface RawSocketedGem {
    typeLine: string
    support: boolean
    properties?: { name: string; values: [string, number][] }[]
    socket: number
  }

  const raw = await apiFetch<RawCharacter>(`/character/${encodeURIComponent(characterName)}`, token)

  // Flatten socketed gems from all equipment slots
  const gems: ActiveGem[] = (raw.equipment ?? []).flatMap(item =>
    (item.socketedItems ?? []).map(gem => ({
      id:          `${item.id}-socket${gem.socket}`,
      name:        gem.typeLine,   // English name — NOT translated
      level:       extractGemLevel(gem),
      quality:     extractGemQuality(gem),
      socketGroup: item.inventoryId,
      isSupport:   gem.support,
    })),
  )

  // Parse passives from hash array (in production, resolve hashes to node IDs)
  const passives: PassiveNode[] = (raw.passives?.hashes ?? []).map(hash => ({
    id:        String(hash),
    name:      `Node #${hash}`,  // Resolved from passive tree data in production
    allocated: true,
    stats:     [],
  }))

  return {
    name:       raw.name,
    class:      raw.class,
    league:     raw.league,
    level:      raw.level,
    experience: raw.experience,
    equipment:  [],   // Raw equipment items stripped — stat derivation happens in buildDiff
    gems,
    passives,
  }
}

// ── Utility parsers ────────────────────────────────────────────────────────────

function extractGemLevel(gem: { properties?: { name: string; values: [string, number][] }[] }): number {
  const levelProp = gem.properties?.find(p => p.name === 'Level')
  if (!levelProp) return 1
  const val = levelProp.values[0]?.[0]
  return parseInt(String(val), 10) || 1
}

function extractGemQuality(gem: { properties?: { name: string; values: [string, number][] }[] }): number {
  const qualProp = gem.properties?.find(p => p.name === 'Quality')
  if (!qualProp) return 0
  const val = String(qualProp.values[0]?.[0] ?? '0').replace('%', '')
  return parseInt(val, 10) || 0
}
