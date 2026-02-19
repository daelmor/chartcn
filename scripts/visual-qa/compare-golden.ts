#!/usr/bin/env npx tsx
/**
 * Compares rendered test charts against golden reference images using pixelmatch.
 *
 * Usage:
 *   npx tsx scripts/visual-qa/compare-golden.ts              # Compare against golden set
 *   npx tsx scripts/visual-qa/compare-golden.ts --update-golden  # Promote current renders as golden
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, copyFileSync } from "node:fs";
import { resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = resolve(__dirname, "../../test-output");
const GOLDEN_DIR = resolve(OUTPUT_DIR, "golden");
const DIFF_DIR = resolve(OUTPUT_DIR, "diffs");

const THRESHOLD = 0.02; // 2% pixel diff = "changed"

interface ComparisonResult {
  name: string;
  status: "pass" | "changed" | "new" | "error";
  diffPercent: number;
  message: string;
}

function comparePngs(actualPath: string, goldenPath: string, diffPath: string): { diffPercent: number } {
  const actualBuf = readFileSync(actualPath);
  const goldenBuf = readFileSync(goldenPath);

  const actual = PNG.sync.read(actualBuf);
  const golden = PNG.sync.read(goldenBuf);

  // Handle size mismatch
  if (actual.width !== golden.width || actual.height !== golden.height) {
    return { diffPercent: 100 };
  }

  const { width, height } = actual;
  const diff = new PNG({ width, height });

  const mismatchedPixels = pixelmatch(
    actual.data,
    golden.data,
    diff.data,
    width,
    height,
    { threshold: 0.1, alpha: 0.3 }
  );

  writeFileSync(diffPath, PNG.sync.write(diff));

  const totalPixels = width * height;
  return { diffPercent: (mismatchedPixels / totalPixels) * 100 };
}

function updateGolden() {
  mkdirSync(GOLDEN_DIR, { recursive: true });

  const pngs = readdirSync(OUTPUT_DIR).filter(
    (f) => f.endsWith(".png") && !f.endsWith("-diff.png")
  );

  if (pngs.length === 0) {
    console.error("No rendered PNGs found in test-output/. Run render-test-charts.ts first.");
    process.exit(1);
  }

  for (const file of pngs) {
    copyFileSync(resolve(OUTPUT_DIR, file), resolve(GOLDEN_DIR, file));
  }

  console.log(`Updated golden set: ${pngs.length} images copied to test-output/golden/`);
}

function runComparison() {
  mkdirSync(DIFF_DIR, { recursive: true });

  const pngs = readdirSync(OUTPUT_DIR).filter(
    (f) => f.endsWith(".png") && !f.endsWith("-diff.png")
  );

  if (pngs.length === 0) {
    console.error("No rendered PNGs found. Run render-test-charts.ts first.");
    process.exit(1);
  }

  if (!existsSync(GOLDEN_DIR)) {
    console.log("No golden directory found. Run with --update-golden to create it.");
    console.log("All charts will be marked as 'new'.");
  }

  const results: ComparisonResult[] = [];

  for (const file of pngs) {
    const name = basename(file, ".png");
    const actualPath = resolve(OUTPUT_DIR, file);
    const goldenPath = resolve(GOLDEN_DIR, file);
    const diffPath = resolve(DIFF_DIR, `${name}-diff.png`);

    if (!existsSync(goldenPath)) {
      results.push({
        name,
        status: "new",
        diffPercent: 100,
        message: "No golden image — new chart",
      });
      continue;
    }

    try {
      const { diffPercent } = comparePngs(actualPath, goldenPath, diffPath);
      const status = diffPercent > THRESHOLD * 100 ? "changed" : "pass";
      results.push({
        name,
        status,
        diffPercent: Math.round(diffPercent * 100) / 100,
        message: status === "pass" ? "OK" : `${diffPercent.toFixed(2)}% pixels differ`,
      });
    } catch (err) {
      results.push({
        name,
        status: "error",
        diffPercent: -1,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Print results
  console.log("Golden Image Comparison");
  console.log("=======================");
  console.log("");

  const passed = results.filter((r) => r.status === "pass");
  const changed = results.filter((r) => r.status === "changed");
  const newCharts = results.filter((r) => r.status === "new");
  const errors = results.filter((r) => r.status === "error");

  for (const r of results) {
    const icon =
      r.status === "pass" ? "  PASS" :
      r.status === "changed" ? "  DIFF" :
      r.status === "new" ? "   NEW" :
      " ERROR";
    const pct = r.diffPercent >= 0 ? `${r.diffPercent.toFixed(2)}%` : "N/A";
    console.log(`${icon}  ${r.name.padEnd(28)} ${pct.padStart(8)}  ${r.message}`);
  }

  console.log("");
  console.log(`Summary: ${passed.length} passed, ${changed.length} changed, ${newCharts.length} new, ${errors.length} errors`);

  if (changed.length > 0) {
    console.log("");
    console.log("Changed charts (>2% diff):");
    for (const r of changed) {
      console.log(`  - ${r.name} (${r.diffPercent.toFixed(2)}%)`);
    }
  }

  // Write JSON results for grid generator
  writeFileSync(
    resolve(OUTPUT_DIR, "comparison-results.json"),
    JSON.stringify(results, null, 2)
  );

  if (changed.length > 0 || errors.length > 0) process.exit(1);
}

// Main
if (process.argv.includes("--update-golden")) {
  updateGolden();
} else {
  runComparison();
}
