#!/usr/bin/env npx tsx
/**
 * Renders all test charts via HTTP POST to the local server and saves PNGs.
 *
 * Usage:
 *   npx tsx scripts/visual-qa/render-test-charts.ts
 *   npx tsx scripts/visual-qa/render-test-charts.ts --filter area
 *   npx tsx scripts/visual-qa/render-test-charts.ts --filter edge
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { testCharts } from "./test-charts.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = resolve(__dirname, "../../test-output");
const BASE_URL = process.env.CHART_URL || "http://localhost:3000";

// Parse --filter flag
const filterIdx = process.argv.indexOf("--filter");
const filter = filterIdx !== -1 ? process.argv[filterIdx + 1] : undefined;

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const charts = filter
    ? testCharts.filter((c) => c.name.includes(filter))
    : testCharts;

  if (charts.length === 0) {
    console.error(`No charts match filter "${filter}"`);
    process.exit(1);
  }

  console.log(`Rendering ${charts.length} chart(s)...`);
  if (filter) console.log(`  Filter: "${filter}"`);
  console.log(`  Server: ${BASE_URL}`);
  console.log(`  Output: ${OUTPUT_DIR}/`);
  console.log("");

  let success = 0;
  let errors = 0;

  for (const chart of charts) {
    const label = `  ${chart.name}`.padEnd(32);
    try {
      const body = {
        ...chart.config,
        format: "png",
      };

      const res = await fetch(`${BASE_URL}/chart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        console.log(`${label} FAIL (HTTP ${res.status}: ${text.slice(0, 100)})`);
        errors++;
        continue;
      }

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("image/png")) {
        console.log(`${label} FAIL (unexpected content-type: ${contentType})`);
        errors++;
        continue;
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      const outPath = resolve(OUTPUT_DIR, `${chart.name}.png`);
      writeFileSync(outPath, buffer);
      console.log(`${label} OK (${(buffer.length / 1024).toFixed(1)} KB)`);
      success++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`${label} ERROR (${msg})`);
      errors++;
    }
  }

  console.log("");
  console.log(`Rendered ${success}/${charts.length} charts` + (errors > 0 ? ` (${errors} errors)` : ""));

  if (errors > 0) process.exit(1);
}

main();
