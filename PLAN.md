# chartcn — Implementation Plan

## 1. Directory Structure

```
chartcn/
├── src/
│   ├── server.ts                    # Fastify server entry point
│   ├── app.ts                       # Fastify app factory (for testing)
│   ├── config.ts                    # Environment variable parsing (env-schema)
│   ├── routes/
│   │   ├── chart.ts                 # GET /chart and POST /chart
│   │   ├── chart-render.ts          # GET /chart/render/:id
│   │   ├── chart-save.ts            # POST /chart/save
│   │   ├── health.ts                # GET /health
│   │   └── preview.ts               # GET /chart/preview (interactive HTML page)
│   ├── schemas/
│   │   ├── chart-config.ts          # Zod schemas for chart config validation
│   │   └── api.ts                   # Request/response Zod schemas
│   ├── renderer/
│   │   ├── index.ts                 # Renderer interface & factory
│   │   ├── puppeteer.ts             # Puppeteer-based renderer (PNG/PDF/SVG)
│   │   ├── resvg.ts                 # resvg-js SVG→PNG converter (used by puppeteer renderer)
│   │   ├── browser-pool.ts          # Puppeteer browser/page pool management
│   │   └── html-template.ts         # Self-contained HTML template builder
│   ├── charts/
│   │   ├── index.ts                 # Chart component registry & factory
│   │   ├── theme.ts                 # Shadcn theme CSS variables & defaults
│   │   ├── components/
│   │   │   ├── area-chart.tsx        # Area chart component
│   │   │   ├── bar-chart.tsx         # Bar chart component
│   │   │   ├── line-chart.tsx        # Line chart component
│   │   │   ├── pie-chart.tsx         # Pie chart component
│   │   │   ├── radar-chart.tsx       # Radar chart component
│   │   │   ├── radial-chart.tsx      # Radial bar chart component
│   │   │   └── chart-wrapper.tsx     # Common wrapper with legend, title, grid
│   │   └── utils.ts                 # Color resolution, series mapping helpers
│   ├── cache/
│   │   └── lru-cache.ts             # LRU cache for rendered images & saved configs
│   └── utils/
│       ├── logger.ts                # Pino logger setup
│       └── hash.ts                  # Config hashing for cache keys
├── static/
│   └── preview.html                 # Interactive chart preview page
├── test/
│   ├── unit/
│   │   ├── schemas.test.ts          # Config validation tests
│   │   ├── chart-components.test.ts # Chart component rendering tests
│   │   └── cache.test.ts            # Cache behavior tests
│   ├── integration/
│   │   ├── api.test.ts              # Full API endpoint tests
│   │   └── render.test.ts           # End-to-end render tests per chart type
│   └── fixtures/
│       └── configs/                 # Sample chart configs for testing
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── .env.example
└── README.md
```

## 2. Dependency List

### Runtime Dependencies

| Package | Purpose |
|---------|---------|
| `fastify` | HTTP server framework — fast, TypeScript-friendly, schema-based validation |
| `@fastify/cors` | CORS support for cross-origin requests |
| `@fastify/rate-limit` | Optional per-IP rate limiting |
| `@fastify/static` | Serve static files (preview page) |
| `zod` | Runtime schema validation for chart configs |
| `recharts` | Chart rendering library (underlying engine for Shadcn-style charts) |
| `react` + `react-dom` | React for building chart component trees and SSR |
| `puppeteer` | Headless Chrome for reliable server-side rendering to PNG/PDF/SVG |
| `generic-pool` | Object pool for managing Puppeteer browser pages |
| `@resvg/resvg-js` | High-performance SVG→PNG conversion (Rust-based, ~40 ops/s) — used as fast-path optimization |
| `pino` | Structured JSON logging (Fastify default) |
| `lru-cache` | In-memory LRU cache for rendered images |
| `nanoid` | Short ID generation for saved chart configs |
| `env-schema` | Environment variable validation for Fastify |

### Dev Dependencies

| Package | Purpose |
|---------|---------|
| `typescript` | TypeScript compiler |
| `tsx` | TypeScript execution (dev server) |
| `@types/react` + `@types/react-dom` | React type definitions |
| `vitest` | Test runner |
| `@types/node` | Node.js type definitions |
| `esbuild` | Fast bundling for the client-side chart rendering template |

## 3. API Design

### `GET /health`

Returns server status.

```
Response 200:
{
  "status": "ok",
  "uptime": 12345,
  "renderer": "puppeteer"
}
```

### `GET /chart`

Quick chart generation via query parameters.

```
GET /chart?type=bar&width=600&height=400&format=png&data=<url-encoded-json>
```

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `type` | string | `"bar"` | Chart type: `line`, `area`, `bar`, `pie`, `radar`, `radial` |
| `width` | number | `600` | Image width in pixels |
| `height` | number | `400` | Image height in pixels |
| `format` | string | `"png"` | Output format: `png`, `svg`, `pdf` |
| `data` | string | — | URL-encoded JSON chart data (see config below) |
| `theme` | string | `"default"` | `"default"` or `"dark"` |
| `bg` | string | `"transparent"` | Background color (CSS color value) |

**Response:** Binary image with appropriate `Content-Type`:
- `image/png` for PNG
- `image/svg+xml` for SVG
- `application/pdf` for PDF

### `POST /chart`

Full chart generation via JSON body.

```json
{
  "type": "area",
  "width": 600,
  "height": 400,
  "format": "png",
  "theme": "default",
  "background": "transparent",
  "config": {
    "title": "Monthly Revenue",
    "description": "Jan - Mar 2025",
    "xAxis": { "key": "month", "label": "Month" },
    "yAxis": { "label": "Revenue ($)" },
    "data": [
      { "month": "Jan", "revenue": 100, "profit": 40 },
      { "month": "Feb", "revenue": 200, "profit": 80 },
      { "month": "Mar", "revenue": 150, "profit": 60 }
    ],
    "series": [
      { "key": "revenue", "label": "Revenue", "color": "#2563eb", "fill": true },
      { "key": "profit", "label": "Profit", "color": "#e11d48" }
    ],
    "legend": true,
    "grid": true,
    "tooltip": false,
    "stacked": false,
    "curved": true
  }
}
```

**Response:** Same binary image response as GET.

**Error Response (400):**
```json
{
  "error": "Validation Error",
  "message": "Invalid chart type: 'scatter'. Supported types: line, area, bar, pie, radar, radial",
  "details": [...]
}
```

### `POST /chart/save`

Save a chart config and receive a short ID.

```json
POST /chart/save
Body: { ...same as POST /chart body... }

Response 201:
{
  "id": "abc123",
  "url": "/chart/render/abc123",
  "expiresAt": "2025-04-01T00:00:00Z"
}
```

### `GET /chart/render/:id`

Render a previously saved chart config by ID.

```
GET /chart/render/abc123?format=png&width=800&height=600
```

Query params can override `format`, `width`, `height` from the saved config.

**Response:** Binary image (same as GET/POST /chart).

### `GET /chart/preview`

Serves an interactive HTML page where users can paste JSON config and see the rendered chart live. This is a static HTML file served by `@fastify/static`.

## 4. Chart Type Mapping

### Component Architecture

Each chart type maps to a React component that wraps the corresponding Recharts component with Shadcn-style theming:

| API `type` | Recharts Component | Shadcn Wrapper | Config Options |
|------------|-------------------|----------------|----------------|
| `line` | `<LineChart>` + `<Line>` | `LineChartComponent` | `curved` (monotone/linear/step), `dotted`, `strokeWidth` |
| `area` | `<AreaChart>` + `<Area>` | `AreaChartComponent` | `stacked`, `gradient` (bool), `curved`, `opacity` |
| `bar` | `<BarChart>` + `<Bar>` | `BarChartComponent` | `stacked`, `horizontal` (uses `layout="vertical"`), `radius` |
| `pie` | `<PieChart>` + `<Pie>` | `PieChartComponent` | `donut` (bool, sets innerRadius), `labels` (bool), `dataKey`, `nameKey` |
| `radar` | `<RadarChart>` + `<Radar>` | `RadarChartComponent` | `filled` (bool), `gridType` (`circle`/`polygon`) |
| `radial` | `<RadialBarChart>` + `<RadialBar>` | `RadialChartComponent` | `innerRadius`, `startAngle`, `endAngle`, `showLabel` |

### Series Configuration

Each series entry in the config maps to a child element of the chart:

```typescript
interface SeriesConfig {
  key: string;        // Data key in each data point
  label: string;      // Human-readable label for legend/tooltip
  color?: string;     // CSS color — defaults to Shadcn palette (--chart-1, --chart-2, ...)
  fill?: boolean;     // Whether to fill the area (area/bar charts)
  opacity?: number;   // Fill opacity (0-1)
  radius?: number;    // Border radius for bars
  strokeWidth?: number;
  strokeDash?: string; // e.g., "5 5" for dashed lines
}
```

### Pie/Donut Data Shape

Pie and donut charts use a flat data array with a single series:

```json
{
  "type": "pie",
  "config": {
    "data": [
      { "name": "Chrome", "value": 65, "color": "#2563eb" },
      { "name": "Firefox", "value": 20, "color": "#e11d48" },
      { "name": "Safari", "value": 15, "color": "#16a34a" }
    ],
    "dataKey": "value",
    "nameKey": "name",
    "donut": true,
    "labels": true
  }
}
```

### Default Shadcn Color Palette

When colors are not specified, the following palette is applied (matching Shadcn's defaults):

```css
--chart-1: 221.2 83.2% 53.3%;   /* Blue */
--chart-2: 346.8 77.2% 49.8%;   /* Rose */
--chart-3: 142.1 76.2% 36.3%;   /* Green */
--chart-4: 47.9 95.8% 53.1%;    /* Amber */
--chart-5: 262.1 83.3% 57.8%;   /* Violet */
```

## 5. Rendering Pipeline

### Why Puppeteer is the Primary Renderer

After researching Recharts' SSR capabilities, I found significant limitations with pure `ReactDOMServer.renderToStaticMarkup()`:

1. **BarChart data doesn't render server-side** — grid and axes render, but bar data content is missing ([recharts/recharts#1806](https://github.com/recharts/recharts/issues/1806))
2. **`ResponsiveContainer` produces empty output** on the server — we must use fixed dimensions (acceptable for our use case)
3. **`useLayoutEffect` warnings** — Recharts uses `useLayoutEffect` internally, which doesn't run on the server
4. **D3 DOM dependency** — Recharts relies on D3, which needs DOM access for some operations

These issues make pure React SSR unreliable for a service that must produce correct output for all chart types. **Puppeteer provides guaranteed correctness** since it runs a real browser.

### Rendering Flow

```
Request
  ↓
1. Validate config (Zod)
  ↓
2. Check cache (hash of config → cached image)
  ├─ HIT → return cached image
  └─ MISS ↓
3. Build HTML page
  │  ├─ Inline React + ReactDOM (from node_modules, pre-bundled)
  │  ├─ Inline Recharts (pre-bundled)
  │  ├─ Inline Shadcn theme CSS
  │  ├─ Inline chart component code (pre-bundled)
  │  └─ Inject chart config as JSON <script> tag
  ↓
4. Acquire page from Puppeteer pool
  ↓
5. Load HTML via page.setContent()
  ↓
6. Wait for chart render completion (page.waitForSelector('.recharts-wrapper'))
  ↓
7. Capture output based on format:
  │  ├─ PNG: page.screenshot({ clip: chartBoundingBox })
  │  ├─ SVG: page.evaluate() → extract <svg> innerHTML
  │  └─ PDF: page.pdf({ width, height })
  ↓
8. Release page back to pool
  ↓
9. Store in cache
  ↓
10. Return response with Content-Type header
```

### HTML Template Strategy

Instead of loading a URL, we use `page.setContent(html)` with a self-contained HTML string. This avoids network requests and is faster. The HTML template is built once at startup by bundling all required JS/CSS into a single file using esbuild:

```
At startup:
  esbuild bundles: React + ReactDOM + Recharts + chart components → single JS blob
  CSS: Shadcn theme variables + base styles → single CSS string

Per request:
  Template is assembled with the bundled assets + chart config JSON injected
  → page.setContent(assembledHTML)
```

### PNG Optimization Path (resvg-js)

For PNG output, we can optionally skip Puppeteer's screenshot and instead:
1. Extract the rendered `<svg>` from the page via `page.evaluate()`
2. Pass the SVG string to `@resvg/resvg-js` for PNG conversion

This is beneficial because resvg-js produces sharper output at ~40 ops/s versus Puppeteer's screenshot mechanism. This optimization is used when the `RENDERER` env var is set to `"resvg"` or as an automatic optimization.

### Browser Pool Configuration

```typescript
// Using generic-pool
const pool = genericPool.createPool({
  create: async () => {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 900 });
    return page;
  },
  destroy: async (page) => {
    await page.close();
  }
}, {
  min: 2,           // Keep 2 warm pages
  max: 10,          // MAX_CONCURRENT_RENDERS from env
  acquireTimeoutMillis: 10000  // RENDER_TIMEOUT_MS from env
});
```

### Caching Strategy

- **Cache key:** SHA-256 hash of `JSON.stringify({ type, width, height, format, theme, config })`
- **Storage:** `lru-cache` with configurable max size (default 500 entries) and TTL (default 3600s)
- **Cache headers:** `ETag` based on config hash, `Cache-Control: public, max-age=3600`
- **Saved configs:** Stored in a separate LRU map (id → config), same TTL

## 6. Open Questions & Trade-offs

### Decided

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Primary renderer** | Puppeteer | Recharts SSR has known issues with BarChart and DOM-dependent features. Puppeteer guarantees visual correctness. |
| **PNG optimization** | resvg-js (optional) | Extract SVG from Puppeteer page, then use resvg-js for faster/sharper PNG conversion. Falls back to Puppeteer screenshot. |
| **HTTP framework** | Fastify | Fastest Node.js framework, great TypeScript support, built-in schema validation, Pino logging included. |
| **Validation** | Zod | Better DX than JSON Schema for complex nested configs. Convert to JSON Schema for Fastify route schemas if needed. |
| **Chart styling** | Shadcn CSS variables | Replicate Shadcn's `--chart-1..5` palette, `--background`, `--foreground`, etc. Both light and dark themes. |
| **Template strategy** | Pre-bundled HTML via `setContent` | Faster than loading URLs. Bundle JS/CSS at startup with esbuild so each render only injects config JSON. |
| **Caching** | In-memory LRU | Simple, no external dependencies. Redis can be added later if horizontal scaling is needed. |

### Trade-offs to Note

1. **Puppeteer container size**: The Docker image will be ~400-500MB due to Chromium. This is unavoidable for reliable rendering. We'll use a multi-stage build and `puppeteer`'s bundled Chromium to keep it as small as possible.

2. **Cold start time**: Puppeteer browser launch takes 1-2s. We mitigate this by launching the browser at server startup (not per-request) and maintaining a page pool.

3. **Memory usage**: Each Puppeteer page uses ~30-50MB. With a pool of 10, that's 300-500MB for the pool alone. The `MAX_CONCURRENT_RENDERS` env var controls this.

4. **resvg-js font support**: resvg-js needs font files for text rendering. If we extract SVG from Puppeteer and pass to resvg-js, any text in the SVG that references system fonts must be available. We'll bundle Inter (or similar) as a fallback font.

5. **No WebSocket/streaming**: Charts are rendered synchronously per request. For very large charts or batch rendering, a queue-based approach would be better — but that's out of scope for Phase 2.

### Future Considerations (Out of Scope for Phase 2)

- Redis-backed cache for multi-instance deployments
- Webhook/queue-based batch rendering
- QuickChart compatibility layer (translate Chart.js configs to Recharts configs)
- Custom font uploads
- Watermarking / branding options

## 7. Implementation Order

### Phase 2a: Core Infrastructure
1. Initialize project (`package.json`, `tsconfig.json`, ESLint)
2. Fastify server setup with config parsing
3. Health endpoint
4. Pino logging
5. Zod schemas for chart config validation

### Phase 2b: Chart Components
6. Shadcn theme CSS (light + dark)
7. Chart wrapper component (title, description, legend, grid)
8. Implement all 6 chart type components (line, area, bar, pie, radar, radial)
9. Chart component registry/factory

### Phase 2c: Rendering Engine
10. esbuild bundle step (React + Recharts + chart components → single JS)
11. HTML template builder
12. Puppeteer browser pool
13. Render pipeline (HTML → Puppeteer → PNG/SVG/PDF)
14. resvg-js PNG optimization path

### Phase 2d: API Routes
15. `POST /chart` endpoint
16. `GET /chart` endpoint (query param parsing)
17. LRU cache integration
18. `POST /chart/save` + `GET /chart/render/:id`
19. `GET /chart/preview` (static HTML page)
20. CORS and rate limiting

### Phase 3: Polish
21. Dockerfile (multi-stage build)
22. docker-compose.yml
23. Error handling hardening
24. README.md with examples

### Phase 4: Testing
25. Unit tests (schemas, cache, chart components)
26. Integration tests (API endpoints, render output)
27. Fixture configs for all chart types
