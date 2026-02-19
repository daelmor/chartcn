# Visual QA Agent

Run the full visual QA pipeline for chartcn: render all test charts, compare against golden images, generate an HTML grid, visually inspect each chart, and report results.

## Steps

### 1. Ensure the server is running

Check if the chartcn server is running on `http://localhost:3000/health`. If not, start it with `npm run dev` in the background and wait for it to be ready.

### 2. Render all test charts

Run:

```bash
npx tsx scripts/visual-qa/render-test-charts.ts
```

This POSTs every test chart config to the local server and saves PNGs to `test-output/`. All charts must render successfully — if any fail, investigate and fix the issue before continuing.

### 3. Run golden comparison

Run:

```bash
npx tsx scripts/visual-qa/compare-golden.ts
```

If no golden directory exists yet (first run), all charts will be marked as "new" — this is expected.

If goldens exist, the script compares each rendered PNG pixel-by-pixel and writes diff images to `test-output/diffs/` and results to `test-output/comparison-results.json`.

### 4. Generate the HTML grid

Run:

```bash
npx tsx scripts/visual-qa/generate-grid.ts
```

This creates `test-output/grid.html` — a self-contained HTML file with all charts displayed as a comparison grid with current/golden/diff columns.

### 5. Visually inspect each chart

Read `test-output/grid.html` and inspect each rendered PNG in `test-output/`. For each chart, evaluate against `scripts/visual-qa/style-guide.md`:

- **Colors**: Correct shadcn palette? Series colors cycle through chart-1..chart-5?
- **Typography**: Title 16px semibold? Description 12px muted? Axis labels 12px muted?
- **Layout**: Proper padding (16px)? Chart fills available space? Nothing clipped?
- **Grid**: Dashed lines ("3 3")? Subtle, not dominant?
- **Theme**: Light/dark applied correctly? Text readable against background?
- **Data**: All data points present? Correct number of series/bars/lines?
- **Features**: Legend shown when expected? Tooltips styled? Dots/radius correct?

Check for anti-patterns (automatic FAIL):
1. Blank or error output
2. Overlapping or clipped text
3. Wrong colors (neon, gray defaults)
4. Missing legend when 2+ series with legend enabled
5. Data mismatch (wrong number of bars/lines)
6. Default unstyled Recharts appearance
7. Broken layout (extends beyond container)
8. Wrong theme (light on dark or vice versa)

### 6. Write a QA report

After inspecting all charts, write a summary:

- Total charts rendered and pass rate
- List any charts with visual issues, grouped by severity
- For each issue: chart name, what's wrong, which style guide rule it violates
- Suggested fixes (which source file to change, what to adjust)

### 7. Fix rendering issues

If any charts have visual bugs:

1. Identify the root cause in the rendering pipeline (`src/charts/components/`, `src/charts/theme.ts`, `src/renderer/html-template.ts`)
2. Fix the issue
3. Re-render affected charts: `npx tsx scripts/visual-qa/render-test-charts.ts --filter <name>`
4. Re-inspect to confirm the fix
5. Repeat until all charts pass

### 8. Update golden images

Once all charts look correct, promote the current renders as the new golden set:

```bash
npx tsx scripts/visual-qa/compare-golden.ts --update-golden
```

Then re-run comparison to verify everything passes:

```bash
npx tsx scripts/visual-qa/compare-golden.ts
```
