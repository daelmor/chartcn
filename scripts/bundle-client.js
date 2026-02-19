import { build } from "esbuild";
import { mkdirSync } from "node:fs";

mkdirSync("dist", { recursive: true });

await build({
  entryPoints: ["src/charts/client-entry.tsx"],
  bundle: true,
  minify: true,
  format: "iife",
  outfile: "dist/chart-client.js",
  jsx: "automatic",
  target: ["chrome100"],
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});

console.log("Client bundle built: dist/chart-client.js");
