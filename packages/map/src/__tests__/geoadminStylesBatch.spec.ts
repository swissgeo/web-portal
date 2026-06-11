import { LV95 } from "@swissgeo/coordinates";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

import type {
  MapLibreLayer,
  MapLibreStyle,
} from "@/utils/geoadminToMapLibreStyle";
import type { GeoAdminGeoJSONStyleDefinition } from "@/utils/geojson";

import { geoadminToMapLibreStyle } from "@/utils/geoadminToMapLibreStyle";

/**
 * Batch conversion gate over the ~60 real geoadmin styles. Populate the snapshot
 * dir first with:  node packages/map/scripts/fetch-geoadmin-styles.mjs
 *
 * When the dir is empty (e.g. CI without network, fresh checkout) the suite skips
 * with a clear hint instead of failing. Once snapshots exist, every style must
 * convert without throwing and produce a structurally valid MapLibre style.
 */
// Resolved relative to the cwd `vitest` runs in (the package root under the test
// scripts, or the repo root) — covers both common invocation points.
const REL = "src/__tests__/fixtures/geoadmin-styles";
const SNAPSHOT_DIR =
  [join(process.cwd(), REL), join(process.cwd(), "packages/map", REL)].find(
    (dir) => existsSync(dir),
  ) ?? join(process.cwd(), REL);

const files = existsSync(SNAPSHOT_DIR)
  ? readdirSync(SNAPSHOT_DIR).filter((f) => f.endsWith(".json"))
  : [];

const ALLOWED_LAYER_TYPES = new Set(["circle", "line", "fill", "symbol"]);

/** Structural validation of a converted style (no external spec-validator dep). */
function validateStyle(style: MapLibreStyle, id: string): string[] {
  const problems: string[] = [];
  if (style.version !== 8) {
    problems.push(`${id}: version is not 8`);
  }
  const sourceIds = Object.keys(style.sources);
  if (sourceIds.length !== 1) {
    problems.push(
      `${id}: expected exactly one source, got ${sourceIds.length}`,
    );
  }
  const sourceId = sourceIds[0];
  if (sourceId && style.sources[sourceId]!.type !== "geojson") {
    problems.push(`${id}: source is not geojson`);
  }
  if (style.layers.length === 0) {
    problems.push(`${id}: produced zero layers (unhandled construct?)`);
  }
  const seenIds = new Set<string>();
  for (const layer of style.layers as MapLibreLayer[]) {
    if (typeof layer.id !== "string" || layer.id === "") {
      problems.push(`${id}: layer with missing id`);
    }
    if (seenIds.has(layer.id)) {
      problems.push(`${id}: duplicate layer id ${layer.id}`);
    }
    seenIds.add(layer.id);
    if (!ALLOWED_LAYER_TYPES.has(layer.type)) {
      problems.push(`${id}: layer ${layer.id} has bad type ${layer.type}`);
    }
    if (layer.source !== sourceId) {
      problems.push(`${id}: layer ${layer.id} not bound to the source`);
    }
    if (layer.filter !== undefined && !Array.isArray(layer.filter)) {
      problems.push(`${id}: layer ${layer.id} filter is not an expression`);
    }
  }
  return problems;
}

describe("geoadmin styles batch conversion", () => {
  if (files.length === 0) {
    it.skip("no snapshots — run: node packages/map/scripts/fetch-geoadmin-styles.mjs", () => {});
    return;
  }

  it("converts every snapshot into a structurally valid MapLibre style", () => {
    const failures: string[] = [];
    const tally = {
      styles: files.length,
      layers: 0,
      byLayerType: {} as Record<string, number>,
      byStyleType: {} as Record<string, number>,
      withIcons: 0,
      withLabels: 0,
    };

    for (const file of files) {
      const id = file.replace(/\.json$/, "");
      let raw: GeoAdminGeoJSONStyleDefinition;
      try {
        raw = JSON.parse(readFileSync(join(SNAPSHOT_DIR, file), "utf-8"));
      } catch {
        failures.push(`${id}: invalid JSON snapshot`);
        continue;
      }

      tally.byStyleType[raw.type] = (tally.byStyleType[raw.type] ?? 0) + 1;

      let result;
      try {
        result = geoadminToMapLibreStyle(raw, id, {
          resolutionToZoom: (res) => LV95.getZoomForResolution(res),
        });
      } catch (err) {
        failures.push(`${id}: converter threw — ${(err as Error).message}`);
        continue;
      }

      failures.push(...validateStyle(result.style, id));

      tally.layers += result.style.layers.length;
      for (const layer of result.style.layers) {
        tally.byLayerType[layer.type] =
          (tally.byLayerType[layer.type] ?? 0) + 1;
      }
      if (result.icons.length > 0) {
        tally.withIcons++;
      }
      if (
        result.style.layers.some(
          (layer) => layer.layout && "text-field" in layer.layout,
        )
      ) {
        tally.withLabels++;
      }
    }

    console.log(
      "geoadmin → MapLibre batch summary:\n" + JSON.stringify(tally, null, 2),
    );
    if (failures.length > 0) {
      console.error("Conversion failures:\n" + failures.join("\n"));
    }

    expect(failures).toEqual([]);
  });
});
