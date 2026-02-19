# chartcn Visual Style Guide

This document is the source of truth for evaluating chart rendering quality.
All values are extracted from `src/charts/theme.ts` and `src/renderer/html-template.ts`.

---

## Color Palette

### Chart Series Colors (cycle through in order)

| Index | Token | Light Theme | Dark Theme |
|-------|-------|-------------|------------|
| 0 | `--chart-1` Blue | `hsl(221.2, 83.2%, 53.3%)` | `hsl(217.2, 91.2%, 59.8%)` |
| 1 | `--chart-2` Rose | `hsl(346.8, 77.2%, 49.8%)` | `hsl(349.7, 89.2%, 60.2%)` |
| 2 | `--chart-3` Green | `hsl(142.1, 76.2%, 36.3%)` | `hsl(142.1, 70.6%, 45.3%)` |
| 3 | `--chart-4` Amber | `hsl(47.9, 95.8%, 53.1%)` | `hsl(47.9, 95.8%, 53.1%)` |
| 4 | `--chart-5` Violet | `hsl(262.1, 83.3%, 57.8%)` | `hsl(263.4, 70%, 50.4%)` |

Series with index >= 5 wrap around (index % 5).

### Background & Foreground

| Element | Light | Dark |
|---------|-------|------|
| Background | `#ffffff` | `#0a0a0a` |
| Foreground (text) | `#0a0a0a` | `#fafafa` |
| Muted foreground | `hsl(215.4, 16.3%, 46.9%)` | `hsl(215, 20.2%, 65.1%)` |
| Grid lines / borders | `hsl(214.3, 31.8%, 91.4%)` | `hsl(217.2, 32.6%, 17.5%)` |

### Tooltip

| Property | Light | Dark |
|----------|-------|------|
| Background | `#ffffff` | `#1a1a2e` |
| Border | grid line color | grid line color |
| Border radius | 6px | 6px |
| Shadow | `0 1px 3px rgba(0,0,0,0.1)` | same |

---

## Typography

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Chart title | 16px | 600 (semibold) | foreground |
| Chart description | 12px | normal | muted-foreground |
| Axis tick labels | 12px | normal | muted-foreground |
| Legend item text | 12px | normal | foreground |

**Font stack:** `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`

---

## Layout & Spacing

| Property | Value |
|----------|-------|
| Container padding | 16px all sides |
| Header bottom margin | 8px |
| Chart area width | request width - 32px |
| Chart area height | request height - header height - 32px |
| Header height | 0 (no title), 30px (title only), 50px (title + description) |

### Default Dimensions
- Standard charts: 600 x 400
- Pie/radar/radial: 500 x 400

---

## Chart-Specific Styling

### Line Charts
- Stroke width: 2px (default)
- Curve type: `monotone` (default) or `linear`
- Dots: hidden by default (`dot={false}`)
- Active dot: radius 4px
- Dashed lines: via `strokeDash` prop (e.g., `"5 5"`)

### Area Charts
- Same line styling as line charts
- Fill: SVG gradient, 80% opacity at top fading to 10% at bottom
- Stacked areas share a single `stackId`

### Bar Charts
- Corner radius: 4px default `[4, 4, 0, 0]` (top-left, top-right, 0, 0)
- Grouped bars: separate bars side by side (no stackId)
- Stacked bars: same stackId
- Horizontal: `layout="vertical"` on chart container

### Pie Charts
- Center: 50%, 50%
- Outer radius: calculated from min(width, height) / 2 - 20
- Donut: inner radius = outer radius * 0.6
- Labels: `{name} {percent}%` format

### Radar Charts
- Grid type: `polygon` (default) or `circle`
- Fill opacity: 0.3 when filled
- Outer radius: "80%"

### Radial Bar Charts
- Bar size: 20px
- Default start angle: 180, end angle: 0
- Inner radius: 30 (default)
- Background bars: enabled

---

## Cartesian Grid
- Stroke dash array: `"3 3"` (dashed lines)
- Horizontal and vertical lines both shown by default
- Color matches grid/border color for the theme
- Grid should be subtle — never visually dominant

---

## What "Good" Looks Like

- **Clean and airy**: Generous whitespace, nothing cramped
- **Smooth curves**: Monotone interpolation on line/area charts
- **Subtle grid**: Dashed, low-contrast, behind the data
- **Soft gradients**: Area fills fade naturally from top to bottom
- **Consistent spacing**: Grouped and stacked bars evenly distributed
- **Readable labels**: All text clearly legible against background
- **Proper contrast**: Dark theme text visible against dark background, and vice versa
- **Correct data**: All data points rendered, axes scaled to fit

---

## Anti-patterns (Automatic FAIL)

These issues should be flagged immediately — score 1 on the relevant dimension:

1. **Blank or error output** — nothing rendered, or server error message in image
2. **Overlapping or clipped text** — axis labels, titles, or legend text cut off or overlaid
3. **Wrong colors** — neon, gray Recharts defaults, or colors outside the Shadcn palette
4. **Missing legend** — when 2+ series present and `legend: true`
5. **Data mismatch** — fewer/more bars or lines than series specified
6. **Default unstyled appearance** — gray background, square bars with no radius, generic Recharts look
7. **Broken layout** — chart extends beyond container, elements positioned outside bounds
8. **Wrong theme** — light colors on dark background or vice versa

---

## Scoring Rubric

| Score | Meaning |
|-------|---------|
| 5 | Pixel-perfect — matches style guide exactly, could ship to production |
| 4 | Minor issues — small spacing/alignment nits, but functionally correct |
| 3 | Acceptable — noticeable issues but chart is usable and data is correct |
| 2 | Significant problems — visual bugs affecting readability or correctness |
| 1 | Broken — anti-pattern present, chart unusable or incorrect |
