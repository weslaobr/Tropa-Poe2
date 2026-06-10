// src/lib/tauriCommands.ts
//
// Type-safe wrappers around Tauri's invoke() calls.
// These mirror the #[tauri::command] functions in src-tauri/src/main.rs.
// In web-only mode (vite dev without Tauri), we provide mock implementations.

// Tauri API import — only available in Tauri context
let tauriInvoke: (<T>(cmd: string, args?: Record<string, unknown>) => Promise<T>) | null = null

// Dynamically import Tauri — this fails gracefully in plain browser context
async function getInvoke() {
  if (tauriInvoke) return tauriInvoke
  try {
    const { invoke } = await import('@tauri-apps/api/tauri')
    tauriInvoke = invoke
    return tauriInvoke
  } catch {
    // Running in plain browser (Vite dev without Tauri) — use mocks
    return null
  }
}

const isTauri = () => '__TAURI__' in window

// ── Command wrappers ──────────────────────────────────────────────────────────

/** Stores the GGG access token securely via Rust */
export async function storeToken(token: string): Promise<void> {
  if (!isTauri()) {
    sessionStorage.setItem('poe2_access_token', token)
    return
  }
  const invoke = await getInvoke()
  await invoke?.('store_token', { payload: { token } })
}

/** Retrieves the stored GGG access token */
export async function getToken(): Promise<string | null> {
  if (!isTauri()) {
    return sessionStorage.getItem('poe2_access_token')
  }
  const invoke = await getInvoke()
  return invoke?.('get_token') ?? null
}

/** Clears the stored token (called on logout) */
export async function clearToken(): Promise<void> {
  if (!isTauri()) {
    sessionStorage.removeItem('poe2_access_token')
    return
  }
  const invoke = await getInvoke()
  await invoke?.('clear_token')
}

/** Reads a .build file from disk via Rust */
export async function readBuildFile(path: string): Promise<string> {
  if (!isTauri()) {
    throw new Error('File reading requires the Tauri desktop context')
  }
  const invoke = await getInvoke()
  if (!invoke) throw new Error('Tauri invoke not available')
  return invoke<string>('read_build_file', { path })
}

/** Returns app version and platform */
export async function getAppInfo(): Promise<{ version: string; platform: string }> {
  if (!isTauri()) {
    return { version: '0.1.0-dev', platform: 'browser' }
  }
  const invoke = await getInvoke()
  return invoke?.('get_app_info') ?? { version: '0.1.0', platform: 'unknown' }
}
