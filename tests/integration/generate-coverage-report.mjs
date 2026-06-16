import v8toIstanbul from "v8-to-istanbul";
import istanbulLibCoverage from "istanbul-lib-coverage";
import istanbulLibReport from "istanbul-lib-report";
import istanbulReports from "istanbul-reports";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";
import { join, resolve } from "node:path";

const { createCoverageMap } = istanbulLibCoverage;
const { createContext } = istanbulLibReport;
const { create } = istanbulReports;

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const coverageDir = resolve(__dirname, "../../coverage/integration");

const map = createCoverageMap({});

// Only read UUID-named JSON files written by the Playwright fixture
const files = readdirSync(coverageDir).filter((f) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.json$/.test(
    f,
  ),
);

if (files.length === 0) {
  console.error("No coverage files found in", coverageDir);
  process.exit(1);
}

const BASE_URL = "http://localhost:3000";

// Only process entries that are our own bundled source files.
// Exclude Vite internals (@id/, @vite/), node_modules, and polyfills.
function isOwnSource(url) {
  if (!url.startsWith(BASE_URL)) return false;
  const path = url.slice(BASE_URL.length);
  return (
    !path.includes("@id/") &&
    !path.includes("@vite/") &&
    !path.includes("node_modules") &&
    !path.includes("__x00__")
  );
}

for (const file of files) {
  const entries = JSON.parse(readFileSync(join(coverageDir, file), "utf-8"));
  for (const entry of entries) {
    if (!isOwnSource(entry.url)) continue;
    if (!entry.source?.includes("//# sourceMappingURL=data:")) continue;
    const converter = v8toIstanbul(entry.url, 0, { source: entry.source });
    await converter.load();
    converter.applyCoverage(entry.functions);
    map.merge(converter.toIstanbul());
  }
}

// Remove node_modules / pnpm entries that leaked in via sourcemap sources
for (const filePath of map.files()) {
  if (filePath.includes("node_modules") || filePath.includes("@fs")) {
    delete map.data[filePath];
  }
}

const context = createContext({ dir: coverageDir, coverageMap: map });

create("lcovonly").execute(context); // → coverage/integration/lcov.info
create("cobertura", { file: "coverage.xml" }).execute(context); // → coverage/integration/coverage.xml

console.log(
  `Coverage reports written to ${coverageDir} (lcov.info, coverage.xml)`,
);

// remove individual JSON files to avoid confusion and save space
await Promise.all(files.map((file) => fs.unlink(join(coverageDir, file))));
