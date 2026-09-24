/**
 * Snapshots the ~60 geoadmin GeoJSON style files into the test fixtures dir so the
 * batch converter test (geoadminStylesBatch.spec.ts) can run against real styles.
 *
 * Usage (Node 18+, needs network):
 *   node packages/map/scripts/fetch-geoadmin-styles.mjs
 *
 * Writes one <layerId>.json per layer into
 *   packages/map/src/__tests__/fixtures/geoadmin-styles/
 * and reports any that failed (e.g. a layer with no published style → 404).
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(here, "../src/__tests__/fixtures");
const outDir = join(fixturesDir, "geoadmin-styles");

const layers = JSON.parse(
  readFileSync(join(fixturesDir, "geoadminLayers.json"), "utf-8"),
);

const styleUrl = (id) =>
  `https://api3.geo.admin.ch/static/vectorStyles/${id}.json`;

mkdirSync(outDir, { recursive: true });

let ok = 0;
const failures = [];

for (const id of layers) {
  const url = styleUrl(id);
  try {
    const res = await fetch(url);
    if (!res.ok) {
      failures.push(`${id}: HTTP ${res.status}`);
      continue;
    }
    const text = await res.text();
    // sanity-check it parses as JSON before writing
    JSON.parse(text);
    writeFileSync(join(outDir, `${id}.json`), text);
    ok++;
    console.log(`✓ ${id}`);
  } catch (err) {
    failures.push(`${id}: ${err.message}`);
  }
}

console.log(`\nFetched ${ok}/${layers.length} styles into ${outDir}`);
if (failures.length) {
  console.log(`\n${failures.length} failed:`);
  for (const f of failures) {
    console.log(`  ✗ ${f}`);
  }
}
