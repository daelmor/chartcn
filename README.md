# chartcn

Chart-as-a-Service API that renders beautiful, Shadcn UI-styled charts as PNG/SVG/PDF images via a simple HTTP API. Built on Recharts with a Puppeteer rendering pipeline.

## Quick Start

```bash
npm install
npm run bundle:client
npm run dev
```

The server starts at `http://localhost:3000`. Open `http://localhost:3000/chart/preview` for the interactive editor.

## API

### `POST /chart`

Render a chart from a JSON config.

```bash
curl -X POST http://localhost:3000/chart \
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

### `GET /chart`

Quick chart via URL query params.

```
GET /chart?type=bar&width=600&height=400&format=png&data={"xAxis":{"key":"x"},"data":[{"x":"A","y":10},{"x":"B","y":20}],"series":[{"key":"y"}]}
```

### `POST /chart/save`

Save a chart config and get a short URL.

```bash
curl -X POST http://localhost:3000/chart/save \
  -H "Content-Type: application/json" \
  -d '{ "type": "line", "config": { ... } }'
# Response: { "id": "abc123", "url": "/chart/render/abc123", "expiresAt": "..." }
```

### `GET /chart/render/:id`

Render a saved chart. Supports `?format=`, `?width=`, `?height=` overrides.

### `GET /chart/preview`

Interactive web UI for building and previewing charts.

### `GET /health`

Health check.

## Supported Chart Types

| Type | Description | Key Options |
|------|-------------|-------------|
| `line` | Line chart | `curved`, `strokeDash` |
| `area` | Area chart with gradient fill | `stacked`, `curved`, `fill` per series |
| `bar` | Bar chart | `stacked`, `horizontal`, `radius` |
| `pie` | Pie / donut chart | `donut`, `labels`, `dataKey`, `nameKey` |
| `radar` | Radar / spider chart | `filled`, `gridType` (circle/polygon) |
| `radial` | Radial bar chart | `innerRadius`, `startAngle`, `endAngle`, `showLabel` |

## Config Reference

```typescript
{
  type: "line" | "area" | "bar" | "pie" | "radar" | "radial",
  width: number,        // 50-4096, default 600
  height: number,       // 50-4096, default 400
  format: "png" | "svg" | "pdf",  // default "png"
  theme: "default" | "dark",      // default "default"
  background: string,   // CSS color, optional
  config: {
    title?: string,
    description?: string,
    xAxis?: { key: string, label?: string, hide?: boolean },
    yAxis?: { label?: string, hide?: boolean },
    data: Array<Record<string, any>>,
    series?: Array<{
      key: string,
      label?: string,
      color?: string,        // CSS color, defaults to Shadcn palette
      fill?: boolean,
      opacity?: number,      // 0-1
      radius?: number,       // bar corner radius
      strokeWidth?: number,
      strokeDash?: string,   // e.g. "5 5"
    }>,
    legend?: boolean,
    grid?: boolean,        // default true
    tooltip?: boolean,     // default true
    stacked?: boolean,
    curved?: boolean,      // default true (monotone interpolation)
    horizontal?: boolean,  // bar chart only
    // Pie/donut
    donut?: boolean,
    labels?: boolean,
    dataKey?: string,      // default "value"
    nameKey?: string,      // default "name"
    // Radar
    filled?: boolean,
    gridType?: "circle" | "polygon",
    // Radial
    innerRadius?: number,
    startAngle?: number,
    endAngle?: number,
    showLabel?: boolean,
  }
}
```

## Theming

Charts use the Shadcn UI color system. When colors are not specified, charts cycle through:

- Chart 1: Blue `hsl(221.2, 83.2%, 53.3%)`
- Chart 2: Rose `hsl(346.8, 77.2%, 49.8%)`
- Chart 3: Green `hsl(142.1, 76.2%, 36.3%)`
- Chart 4: Amber `hsl(47.9, 95.8%, 53.1%)`
- Chart 5: Violet `hsl(262.1, 83.3%, 57.8%)`

Set `"theme": "dark"` for dark mode variants.

## Docker

```bash
docker compose up --build
```

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

## Architecture

```
HTTP Request → Zod Validation → Cache Check → Build HTML Template
  → Puppeteer Page Pool → setContent(html) → Wait for Recharts render
  → Screenshot (PNG) / Extract SVG / Generate PDF
  → Cache Result → Return Image
```

- **Rendering**: Puppeteer with a reusable page pool for consistent, accurate chart rendering
- **PNG optimization**: SVG extracted from Puppeteer, converted via `@resvg/resvg-js` for sharper output
- **Caching**: In-memory LRU cache keyed by config hash
- **Client bundle**: React + Recharts pre-bundled with esbuild (~593KB) loaded once per page

## Development

```bash
npm run dev          # Start with hot reload
npm run bundle:client # Rebuild client bundle
npm test             # Run tests
npm run build        # Production build
```

## License

MIT
