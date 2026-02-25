# chartcn

Chart-as-a-Service API that renders Shadcn UI-styled charts as PNG/SVG/PDF images. POST a JSON chart config, get back a rendered image. Built on Recharts with a Puppeteer rendering pipeline.

**Public URL**: `https://chartcn.ashyplant-7f14845c.eastus.azurecontainerapps.io`

**Interactive editor**: https://chartcn.ashyplant-7f14845c.eastus.azurecontainerapps.io/chart/preview

## Quick Start

```bash
npm install
npm run bundle:client
npm run dev
```

The server starts at `http://localhost:3000`.

## API Reference

Base URL: `https://chartcn.ashyplant-7f14845c.eastus.azurecontainerapps.io`

### `POST /chart`

Render a chart from a JSON config. Returns the rendered image as binary data.

**Request**:

```bash
curl -X POST https://chartcn.ashyplant-7f14845c.eastus.azurecontainerapps.io/chart \
  -H "Content-Type: application/json" \
  -d '{
    "type": "bar",
    "width": 600,
    "height": 400,
    "format": "png",
    "theme": "default",
    "config": {
      "title": "Monthly Revenue",
      "xAxis": { "key": "month" },
      "data": [
        { "month": "Jan", "revenue": 186, "profit": 80 },
        { "month": "Feb", "revenue": 305, "profit": 200 },
        { "month": "Mar", "revenue": 237, "profit": 120 }
      ],
      "series": [
        { "key": "revenue", "label": "Revenue" },
        { "key": "profit", "label": "Profit" }
      ],
      "legend": true,
      "grid": true
    }
  }' -o chart.png
```

**Response**: Binary image with appropriate `Content-Type` header (`image/png`, `image/svg+xml`, or `application/pdf`).

**Response headers**:
- `Content-Type`: MIME type matching the requested format
- `ETag`: Config hash for cache validation
- `Cache-Control`: `public, max-age=3600`
- `X-Cache`: `HIT` (served from cache) or `MISS` (freshly rendered)

**Error response** (400):

```json
{
  "error": "Validation Error",
  "message": "Human-readable message",
  "details": [{ "code": "...", "path": ["config", "data"], "message": "..." }]
}
```

### `GET /chart`

Quick chart rendering via URL query params. The chart config is passed as a JSON string in the `data` query parameter.

```
GET /chart?type=bar&width=600&height=400&format=png&data={"xAxis":{"key":"x"},"data":[{"x":"A","y":10},{"x":"B","y":20}],"series":[{"key":"y"}]}
```

### `POST /chart/save`

Save a chart config and get a short ID for later rendering. Accepts the same body as `POST /chart`.

```bash
curl -X POST https://chartcn.ashyplant-7f14845c.eastus.azurecontainerapps.io/chart/save \
  -H "Content-Type: application/json" \
  -d '{
    "type": "line",
    "config": {
      "title": "Saved Chart",
      "xAxis": { "key": "x" },
      "data": [{ "x": "A", "y": 10 }, { "x": "B", "y": 20 }],
      "series": [{ "key": "y", "label": "Value" }]
    }
  }'
```

**Response** (201):

```json
{
  "id": "H2VpvHQr19Lslz",
  "url": "/chart/render/H2VpvHQr19Lslz"
}
```

When blob storage is not configured, an `expiresAt` field is included (configs expire based on `CACHE_TTL_SECONDS`). With blob storage enabled (production), saved charts are persistent.

### `GET /chart/render/:id`

Render a previously saved chart by its ID. Supports query param overrides:
- `?format=svg` — override output format
- `?width=800` — override width
- `?height=600` — override height

```bash
curl https://chartcn.ashyplant-7f14845c.eastus.azurecontainerapps.io/chart/render/H2VpvHQr19Lslz -o chart.png
```

### `GET /chart/preview`

Interactive web UI for building and previewing charts in the browser.

### `GET /health`

Health check. Returns `{"status":"ok","uptime":...,"renderer":"puppeteer"}`.

## Chart Config Schema

All endpoints accept the same config structure. The top-level object wraps rendering options around a `config` object containing the chart data and options.

```typescript
{
  // Rendering options (top-level)
  type: "line" | "area" | "bar" | "pie" | "radar" | "radial",  // default "bar"
  width: number,        // 50-4096, default 600
  height: number,       // 50-4096, default 400
  format: "png" | "svg" | "pdf",  // default "png"
  theme: "default" | "dark",      // default "default"
  background: string,   // CSS color, optional

  // Chart configuration
  config: {
    title?: string,
    description?: string,

    // Axes (line, area, bar)
    xAxis?: { key: string, label?: string, hide?: boolean },
    yAxis?: { label?: string, hide?: boolean },

    // Data — array of objects, each object is one data point
    data: Array<Record<string, any>>,

    // Series — which data keys to plot (line, area, bar, radar)
    series?: Array<{
      key: string,           // must match a key in data objects
      label?: string,        // display label
      color?: string,        // CSS color, defaults to Shadcn palette
      fill?: boolean,
      opacity?: number,      // 0-1
      radius?: number,       // bar corner radius
      strokeWidth?: number,
      strokeDash?: string,   // e.g. "5 5"
    }>,

    // Common options
    legend?: boolean,
    grid?: boolean,          // default true
    tooltip?: boolean,       // default true
    stacked?: boolean,
    curved?: boolean,        // default true (monotone interpolation)
    horizontal?: boolean,    // bar chart only

    // Pie/donut specific
    donut?: boolean,
    labels?: boolean,
    dataKey?: string,        // value field, default "value"
    nameKey?: string,        // label field, default "name"
    innerRadius?: number,

    // Radar specific
    filled?: boolean,
    gridType?: "circle" | "polygon",

    // Radial bar specific
    startAngle?: number,
    endAngle?: number,
    showLabel?: boolean,
  }
}
```

## Chart Type Examples

### Line / Area / Bar

These chart types use `xAxis.key` to identify the category field and `series` to specify which data keys to plot.

```json
{
  "type": "line",
  "config": {
    "title": "Sales Trend",
    "xAxis": { "key": "month" },
    "data": [
      { "month": "Jan", "sales": 100, "returns": 10 },
      { "month": "Feb", "sales": 150, "returns": 8 },
      { "month": "Mar", "sales": 130, "returns": 12 }
    ],
    "series": [
      { "key": "sales", "label": "Sales" },
      { "key": "returns", "label": "Returns", "strokeDash": "5 5" }
    ],
    "legend": true
  }
}
```

### Pie / Donut

Pie charts use `nameKey` and `dataKey` to identify label and value fields in the data array.

```json
{
  "type": "pie",
  "config": {
    "title": "Market Share",
    "data": [
      { "name": "Chrome", "value": 65 },
      { "name": "Firefox", "value": 15 },
      { "name": "Safari", "value": 12 },
      { "name": "Edge", "value": 8 }
    ],
    "donut": true,
    "labels": true,
    "legend": true
  }
}
```

### Radar

```json
{
  "type": "radar",
  "config": {
    "title": "Skills",
    "xAxis": { "key": "skill" },
    "data": [
      { "skill": "JS", "alice": 90, "bob": 70 },
      { "skill": "CSS", "alice": 80, "bob": 85 },
      { "skill": "React", "alice": 95, "bob": 60 }
    ],
    "series": [
      { "key": "alice", "label": "Alice" },
      { "key": "bob", "label": "Bob" }
    ],
    "filled": true
  }
}
```

### Radial Bar

```json
{
  "type": "radial",
  "config": {
    "title": "Progress",
    "data": [
      { "name": "Q1", "value": 75 },
      { "name": "Q2", "value": 50 },
      { "name": "Q3", "value": 90 }
    ],
    "showLabel": true,
    "legend": true
  }
}
```

## Theming

Charts use the Shadcn UI color system. When colors are not specified, series cycle through:

- Chart 1: Blue `hsl(221.2, 83.2%, 53.3%)`
- Chart 2: Rose `hsl(346.8, 77.2%, 49.8%)`
- Chart 3: Green `hsl(142.1, 76.2%, 36.3%)`
- Chart 4: Amber `hsl(47.9, 95.8%, 53.1%)`
- Chart 5: Violet `hsl(262.1, 83.3%, 57.8%)`

Set `"theme": "dark"` for dark mode variants.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `HOST` | `0.0.0.0` | Server host |
| `CACHE_MAX_SIZE` | `500` | Max cached images |
| `CACHE_TTL_SECONDS` | `3600` | Cache TTL |
| `MAX_CONCURRENT_RENDERS` | `10` | Puppeteer page pool max |
| `RENDER_TIMEOUT_MS` | `10000` | Render timeout |
| `LOG_LEVEL` | `info` | Pino log level |
| `RATE_LIMIT_RPM` | `60` | Requests per minute (0 = disabled) |
| `CHROMIUM_PATH` | auto-detect | Path to Chromium binary |
| `AZURE_STORAGE_ACCOUNT_NAME` | — | Azure Blob Storage account (enables persistent chart storage) |
| `AZURE_STORAGE_CONNECTION_STRING` | — | Azure Blob Storage connection string (alternative to managed identity) |

## Architecture

```
HTTP Request → Zod Validation → Cache Check → Build HTML Template
  → Puppeteer Page Pool → setContent(html) → Wait for Recharts render
  → Screenshot (PNG) / Extract SVG / Generate PDF
  → Cache Result → Return Image
```

- **Rendering**: Puppeteer with a reusable page pool for consistent, accurate chart rendering
- **PNG**: Direct Puppeteer screenshot at 2x device scale for crisp output
- **SVG**: Extracted from the Recharts DOM element
- **PDF**: Puppeteer PDF generation with background printing
- **Caching**: Two-tier — in-memory LRU (L1) + Azure Blob Storage (L2, optional) keyed by config hash
- **Client bundle**: React + Recharts pre-bundled with esbuild, loaded once per Puppeteer page

## Docker

```bash
docker compose up --build
```

## Development

```bash
npm run dev          # Start with hot reload
npm run bundle:client # Rebuild client bundle
npm test             # Run tests
npm run build        # Production build
```

## License

MIT
