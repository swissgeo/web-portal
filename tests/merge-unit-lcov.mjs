import {
  readdirSync,
  readFileSync,
  mkdirSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { fileURLToPath } from "node:url";
import { join, resolve } from "node:path";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const unitDir = resolve(__dirname, "../coverage/unit");
const outDir = resolve(__dirname, "../coverage/unit");

const packageDirs = readdirSync(unitDir, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => ({ name: e.name, path: join(unitDir, e.name) }));

function findFiles(dirs, filename) {
  return dirs
    .filter(({ path }) => {
      try {
        readFileSync(join(path, filename));
        return true;
      } catch {
        return false;
      }
    })
    .map(({ name, path }) => ({ name, file: join(path, filename) }));
}

// merge lcov
const lcovFiles = findFiles(packageDirs, "lcov.info");
if (lcovFiles.length === 0) {
  console.error("No lcov.info files found under", unitDir);
  process.exit(1);
}
const mergedLcov = lcovFiles
  .map(({ name, file }) =>
    // Prefix every SF: path with packages/<name>/ so paths are unique and
    // grouped per package in coverage tools
    readFileSync(file, "utf-8").replace(/^SF:/gm, `SF:packages/${name}/`),
  )
  .join("\n");
mkdirSync(outDir, { recursive: true });
const lcovOut = join(outDir, "lcov.info");
writeFileSync(lcovOut, mergedLcov);
console.log(`Merged ${lcovFiles.length} lcov.info files → ${lcovOut}`);

// merge cobertura
const coberturaFiles = findFiles(packageDirs, "cobertura-coverage.xml");
if (coberturaFiles.length > 0) {
  const packagesContent = coberturaFiles
    .map(({ name, file }) => {
      const xml = readFileSync(file, "utf-8");
      const match = xml.match(/<packages>([\s\S]*?)<\/packages>/);
      if (!match) return "";
      // Prefix every filename= attribute with packages/<name>/
      return match[1].replace(
        /filename="([^"]*)"/g,
        `filename="packages/${name}/$1"`,
      );
    })
    .join("");

  const mergedXml = [
    `<?xml version="1.0" ?>`,
    `<!DOCTYPE coverage SYSTEM "http://cobertura.sourceforge.net/xml/coverage-04.dtd">`,
    `<coverage version="coverage-04">`,
    `  <packages>${packagesContent}  </packages>`,
    `</coverage>`,
  ].join("\n");

  const coberturaOut = join(outDir, "coverage.xml");
  writeFileSync(coberturaOut, mergedXml);
  console.log(
    `Merged ${coberturaFiles.length} cobertura-coverage.xml files → ${coberturaOut}`,
  );
} else {
  console.warn("No cobertura-coverage.xml files found, skipping coverage.xml");
}

// clean up per-package directories
for (const { path } of packageDirs) {
  rmSync(path, { recursive: true, force: true });
}
console.log(`Removed ${packageDirs.length} per-package coverage directories`);
