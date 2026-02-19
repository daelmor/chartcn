# chartcn — Chart-as-a-Service API

## What this project does

HTTP API that renders Recharts charts as PNG/SVG/PDF images. You POST a JSON chart config, get back a rendered image. Uses Puppeteer (headless Chrome) for server-side rendering with Shadcn UI color theming.

## Tech stack

- **Runtime**: Node.js 22, TypeScript 5.6, Fastify 5
- **Rendering**: Recharts 2.12 + React 18 rendered inside Puppeteer (headless Chrome)
- **PNG optimization**: SVG extracted from Puppeteer, converted via @resvg/resvg-js
- **Validation**: Zod schemas
- **Caching**: In-memory LRU (keyed by config hash)
- **Testing**: Vitest
- **Build**: esbuild (client bundle), tsc (server)
- **Deployment**: Docker → Azure Container Apps via GitHub Actions

## Key commands

```bash
npm run dev              # Start server with hot reload (tsx watch)
npm run bundle:client    # Rebuild client JS bundle (React+Recharts)
npm run build            # tsc + bundle:client (production build)
npm test                 # Run all tests (vitest)
npx vitest run test/unit/        # Unit tests only
npx vitest run test/integration/ # Integration tests only (needs Chromium)
npx tsc --noEmit         # Type-check without emitting
```

## Local development

Requires a Chromium/Chrome binary. On macOS it auto-detects `/Applications/Google Chrome.app/...`. You can also set `CHROMIUM_PATH` env var. See `.env.example` for all config options.

The client bundle (`dist/chart-client.js`) must be built before the server can render charts. Run `npm run bundle:client` after changing anything in `src/charts/client-entry.tsx`.

## Project structure

```
src/
  server.ts              # Entry point
  app.ts                 # Fastify app factory, route registration
  config.ts              # Env var parsing (Zod)
  routes/                # HTTP handlers (chart, chart-save, chart-render, health, preview)
  schemas/               # Zod schemas (chart-config.ts is the main one)
  renderer/
    browser-pool.ts      # Puppeteer page pool (generic-pool)
    html-template.ts     # Builds self-contained HTML for Puppeteer
    index.ts             # Render orchestration (PNG/SVG/PDF)
    resvg.ts             # SVG→PNG conversion
  charts/
    client-entry.tsx     # Bundled by esbuild, runs inside Puppeteer
    components/          # React chart components (line, area, bar, pie, radar, radial)
    theme.ts             # Shadcn color palette
    utils.ts             # Series resolution helpers
  cache/lru-cache.ts     # Image + config store caching
test/
  unit/                  # Schema validation, cache tests
  integration/           # Full API endpoint tests (needs Chromium)
  fixtures/configs/      # JSON chart configs for test cases
infra/
  main.bicep             # Azure IaC (ACR, Container Apps, Log Analytics)
  setup-azure.sh         # One-time Azure + GitHub secrets setup
```

## Architecture: rendering pipeline

```
POST /chart → Zod validate → check LRU cache → build HTML template
  → acquire Puppeteer page from pool → setContent(html)
  → wait for window.__CHART_READY__ → capture PNG/SVG/PDF
  → cache result → return binary response
```

The client-entry.tsx is pre-bundled by esbuild into a single JS file. Each render injects the chart config as `window.__CHART_CONFIG__` into an HTML template, loads the bundle, and waits for the chart to signal readiness.

## API endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | /chart | Render chart from JSON config |
| GET | /chart | Quick render via query params |
| POST | /chart/save | Save config, get short ID |
| GET | /chart/render/:id | Render a saved chart |
| GET | /chart/preview | Interactive web editor |
| GET | /health | Health check |

## Deployment

- **Live URL**: https://chartcn.ashyplant-7f14845c.eastus.azurecontainerapps.io
- **CI/CD**: Push to `main` triggers GitHub Actions (test → build Docker → deploy to Azure Container Apps)
- **Azure resources**: Resource group `chartcn-rg`, ACR `chartcnacrrq3xqtfv47q7c`
- **Manual image build**: `az acr build --registry chartcnacrrq3xqtfv47q7c --image chartcn:latest .`

## Common pitfalls

- **`tsc` fails but `tsx` works**: `tsx` skips type checking. Always run `npx tsc --noEmit` before pushing.
- **Client bundle not found**: Run `npm run bundle:client` — the server needs `dist/chart-client.js` to exist.
- **Chromium not found**: Set `CHROMIUM_PATH` or ensure Chrome/Chromium is installed. The Docker image uses `/usr/bin/chromium`.
- **Charts render as black/monochrome**: The resvg SVG→PNG path doesn't handle CSS HSL colors well. The Puppeteer screenshot fallback preserves colors.
- **Integration tests need Chromium**: They spin up the full Fastify+Puppeteer stack. Unit tests don't need it.

## Style conventions

- ESM (`"type": "module"` in package.json), `.js` extensions in imports
- Strict TypeScript (`strict: true`, `noUnusedLocals`, `noUnusedParameters`)
- JSX transform: `react-jsx` (no need to import React in .tsx files)
- Fastify plugin pattern for routes (exported async function registered via `app.register`)
