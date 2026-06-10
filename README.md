# PoE2 SyncCompanion

> **Open-source, ultra-lightweight Path of Exile 2 build tracking companion**  
> Built with Tauri + React + TypeScript + Tailwind CSS

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)

---

## Features

- 🔑 **OAuth2 Authentication** — Connects to your GGG account securely (PKCE flow, no client secret stored)
- 📂 **Build File Loader** — Parses `.build` files from Path of Building and similar tools
- 📊 **Passive Tree Progress** — Shows next recommended nodes based on your current level
- 💎 **Gem Comparison** — Highlights missing gems and underleveled support links
- ⚔️ **Stat Comparison** — Compares your current attributes and resistances vs. build targets
- 🔄 **Auto-Sync** — Syncs with the GGG API every 60 seconds (or manually)
- 🌐 **i18n** — Full PT-BR / English interface (game terms stay in English)
- 🪶 **Ultra-lightweight** — Tauri binary < 5MB, runtime < 20MB RAM

---

## Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Desktop   | Tauri 1.x (Rust)                    |
| Frontend  | React 18 + TypeScript               |
| Styling   | Tailwind CSS 3 (PoE dark theme)     |
| Icons     | Lucide React                        |
| i18n      | i18next + react-i18next             |
| Build     | Vite 5                              |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18
- [Rust](https://rustup.rs/) (stable toolchain)
- [Tauri CLI prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites/)

### Development

```bash
# Install dependencies
npm install

# Run frontend only (Vite dev server — no Tauri)
npm run dev

# Run with Tauri (full desktop app)
npm run tauri dev
```

### Build for Production

```bash
npm run tauri build
```

The installer will be in `src-tauri/target/release/bundle/`.

---

## Project Structure

```
poe2-sync-companion/
├── src/                          # React frontend
│   ├── App.tsx                   # Root component & state
│   ├── main.tsx                  # Entry point
│   ├── components/
│   │   ├── LoginScreen.tsx       # Auth + setup screen
│   │   ├── Dashboard.tsx         # Main dashboard + progress bar
│   │   └── tabs/
│   │       ├── PassivesTab.tsx   # Passive tree diff
│   │       ├── GemsTab.tsx       # Gem links diff
│   │       └── StatsTab.tsx      # Attributes/resistances diff
│   ├── lib/
│   │   ├── buildDiff.ts          # ✨ Core diff engine
│   │   ├── buildParser.ts        # .build file JSON parser
│   │   ├── gggApi.ts             # GGG API + OAuth2 PKCE
│   │   ├── mockData.ts           # Dev mock data
│   │   └── tauriCommands.ts      # Type-safe Tauri invoke wrappers
│   ├── i18n/
│   │   ├── config.ts             # i18next setup
│   │   └── locales/
│   │       ├── pt-BR.json        # Portuguese strings
│   │       └── en.json           # English strings
│   ├── types/
│   │   └── app.ts                # Global TypeScript types
│   └── styles/
│       └── index.css             # Global CSS + Tailwind components
├── src-tauri/                    # Rust backend
│   ├── src/main.rs               # Tauri commands
│   ├── build.rs                  # Build script
│   ├── Cargo.toml                # Rust dependencies
│   └── tauri.conf.json           # App config & permissions
├── tailwind.config.js            # PoE-inspired theme
├── vite.config.ts
└── package.json
```

---

## GGG API Registration

To use real GGG OAuth2 authentication:

1. Visit [pathofexile.com/developer/docs/authorization](https://www.pathofexile.com/developer/docs/authorization)
2. Register your application
3. Set the redirect URI to `http://localhost:1420/oauth/callback`
4. Copy your **Client ID** to `.env`:
   ```env
   VITE_GGG_CLIENT_ID=your_client_id_here
   ```

---

## i18n Rules

> ⚠️ **IMPORTANT**: UI strings (buttons, menus, labels) are translated.  
> Game content (gem names, passive names, item names, modifiers) are **always in English** — never translated.  
> This ensures compatibility with the GGG API and `.build` file formats.

---

## License

MIT © 2024 — Open Source. Contributions welcome!
