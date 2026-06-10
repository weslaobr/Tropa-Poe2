// src-tauri/src/main.rs
//
// PoE2 SyncCompanion — Tauri backend (Rust)
//
// Tauri commands exposed to the frontend via invoke().
// All heavy I/O (file reads, secure token storage) lives here.
// The GGG API HTTP calls are made from the frontend via Tauri's
// HTTP allowlist to keep the Rust side minimal.

#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"   // Hides console window on Windows release
)]

use tauri::{Manager, State};
use std::sync::Mutex;
use serde::{Deserialize, Serialize};

// ── In-memory secure token store ─────────────────────────────────────────────
// In production, use the OS keychain (keytar crate or tauri-plugin-store
// with encryption) instead of in-memory storage.

#[derive(Default)]
struct TokenStore(Mutex<Option<String>>);

// ── Types ─────────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize)]
struct StoreTokenPayload {
    token: String,
}

#[derive(Debug, Serialize)]
struct AppInfo {
    version:  String,
    platform: String,
}

// ── Tauri Commands ─────────────────────────────────────────────────────────────

/// Stores the GGG access token in memory (upgrade to OS keychain for v1.0).
#[tauri::command]
fn store_token(payload: StoreTokenPayload, store: State<TokenStore>) -> Result<(), String> {
    let mut lock = store.0.lock().map_err(|e| e.to_string())?;
    *lock = Some(payload.token);
    Ok(())
}

/// Retrieves the stored GGG access token, if present.
#[tauri::command]
fn get_token(store: State<TokenStore>) -> Option<String> {
    store.0.lock().ok()?.clone()
}

/// Clears the stored token on logout.
#[tauri::command]
fn clear_token(store: State<TokenStore>) -> Result<(), String> {
    let mut lock = store.0.lock().map_err(|e| e.to_string())?;
    *lock = None;
    Ok(())
}

/// Returns app metadata to the frontend.
#[tauri::command]
fn get_app_info() -> AppInfo {
    AppInfo {
        version:  env!("CARGO_PKG_VERSION").to_string(),
        platform: std::env::consts::OS.to_string(),
    }
}

/// Reads a .build file from disk. Frontend passes the path from the dialog.
/// This runs in Rust so we can validate the file before sending to JS.
#[tauri::command]
fn read_build_file(path: String) -> Result<String, String> {
    // Basic path sanitization
    if path.is_empty() {
        return Err("Empty path provided".to_string());
    }

    std::fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file '{}': {}", path, e))
}

// ── Main ──────────────────────────────────────────────────────────────────────

fn main() {
    tauri::Builder::default()
        // Register our in-memory token store as managed state
        .manage(TokenStore::default())
        // Register all commands exposed to the frontend
        .invoke_handler(tauri::generate_handler![
            store_token,
            get_token,
            clear_token,
            get_app_info,
            read_build_file,
        ])
        .setup(|app| {
            // In debug builds, open DevTools automatically
            #[cfg(debug_assertions)]
            {
                let window = app.get_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
