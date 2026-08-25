# Tropa PoE2 Ecosystem

> **Web app de alta performance para otimização de builds, upgrades no Trade, análise de Tablets/Mapas e guia dinâmico de leveling — Path of Exile 2**
>
> Interface ultrafluida, carregamento instantâneo, feita para o segundo monitor.

---

## Stack

| Camada        | Tecnologia                                        |
|---------------|---------------------------------------------------|
| Frontend      | Next.js (App Router) · React 19 · TypeScript     |
| Estilo        | Tailwind CSS 3 (tema PoE: dourado/carmim/sombra) |
| Parser Engine | Node.js + `fast-xml-parser` + `node:zlib`         |
| Cache/APIs    | Redis + Trade API (planejado v1.5)                |

```
[Frontend - Next.js / Tailwind]
              │
              ▼
[API Layer - Route Handlers] ───► [PoB Parser / Zlib Engine]
              │
              ├───► [PoE 2 Official Trade API]   (v1.5)
              ├───► [PoE Ninja API]              (v1.5)
              └───► [PostgreSQL / Redis Cache]   (v2.0)
```

## Roadmap

### ✅ v1.0 — MVP (Core & Importação)

- **Importador PoB/PoE Ninja** — cole o código comprimido (Base64 URL-safe + Zlib); o Route Handler `/api/import` infla o XML e converte em JSON tipado.
- **Dashboard do personagem** (`/build/[id]`) — DPS efetivo, vida/ES/mana, cap de resistências com alerta visual, equipamentos, gems/suportes e link da árvore passiva.
- **Calculadora de Upgrades** (`/trade-calc`) — comparação manual de 2 itens com variação percentual por atributo.

### 🔜 v1.5 — Módulo Trade & Otimizador

- Integração com a **API oficial do Trade** buscando os status que faltam na build.
- Métrica de eficiência **DPS/Orb** dos listings.
- **Tablet & Map Analyzer** — heurística inicial já implementada em `src/lib/map-evaluator.ts` (alertas para reflect, res máx reduzida, recovery reduzido etc.).

### 🔮 v2.0 — Leveling Assist & Ecossistema

- Guia de atos dinâmico com checklist de passivas e gems por NPC.
- **Tropa Cloud**: login via Discord, histórico de builds e comparativos da comunidade.

## Estrutura

```text
tropa-poe2/
├── src/
│   ├── app/
│   │   ├── api/import/route.ts   # POST /api/import — PoB Parser / Zlib Engine
│   │   ├── build/[id]/page.tsx   # Dashboard da build importada
│   │   ├── trade-calc/page.tsx   # Calculadora de upgrades
│   │   ├── leveling/page.tsx     # Guia de atos (v2.0)
│   │   ├── layout.tsx
│   │   └── page.tsx              # Home + importador
│   ├── components/
│   │   ├── build/item-card.tsx
│   │   ├── ui/                   # Card, Button (estilo shadcn, sem runtime extra)
│   │   ├── pob-import-form.tsx
│   │   ├── recent-builds.tsx
│   │   └── site-header.tsx
│   ├── lib/
│   │   ├── pob-parser.ts         # Engine Base64url → Zlib → XML → JSON
│   │   ├── build-store.ts        # Persistência local (localStorage)
│   │   ├── map-evaluator.ts      # Heurística de risco de mapas/tablets
│   │   └── trade-api.ts          # Integrador Trade API (v1.5) + DPS/Orb
│   └── types/poe2.ts             # Tipos da estrutura PoE 2 / PoB
├── BUILDS/                       # Builds .build do usuário (dados locais)
└── scripts/smoke-pob.ts          # Teste funcional do parser
```

## Como rodar

```bash
npm install

# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Teste funcional do parser PoB
npm run test:parser

# Lint
npm run lint
```

## Formato do código PoB

O código exportado pelo Path of Building/PoE Ninja é `base64url(zlib(xml))`. O parser:

1. Normaliza `-`/`_` → `+`/`/`, completa padding Base64;
2. Infla via `zlib.inflateSync` (com fallback `inflateRawSync`);
3. Converte XML → JSON com `fast-xml-parser`;
4. Normaliza em `ParsedBuild`: metadata, stats, items (rarity/name/base/mods), skill groups (gems + suportes) e árvore passiva.

Builds importadas ficam salvas apenas no `localStorage` do navegador (chave determinística FNV-1a do código — reimportar o mesmo código não duplica).

## Variáveis de ambiente

Copie `.env.example` para `.env.local`. Nada é obrigatório na v1.0; as chaves de Trade/Discord serão usadas nas versões futuras.

---

MIT © — Projeto da comunidade. Sem afiliação com Grinding Gear Games.
