import TileGrid from "ol/tilegrid/TileGrid";
import WMTSTileGrid from "ol/tilegrid/WMTS";

/** Relative gap under which two resolutions are the same tile level, e.g. after rounding a scale */
const RESOLUTION_TOLERANCE = 1e-3;

/**
 * Keeps only the tile level of the grid that has the given resolution, so a layer requests that
 * level whatever the resolution of the view. Without it, the level closest to the view resolution
 * is used, which can be the level of another scale.
 *
 * The grid is returned as it is when it has no such level.
 */
export function pinTileGrid(
  tileGrid: WMTSTileGrid,
  resolution: number | null,
): WMTSTileGrid;
export function pinTileGrid(
  tileGrid: TileGrid | undefined,
  resolution: number | null,
): TileGrid | undefined;
export function pinTileGrid(
  tileGrid: TileGrid | undefined,
  resolution: number | null,
): TileGrid | undefined {
  if (!tileGrid || resolution === null) {
    return tileGrid;
  }

  const resolutions = tileGrid.getResolutions();
  const z = resolutions.findIndex(
    (candidate) =>
      Math.abs(candidate - resolution) / resolution < RESOLUTION_TOLERANCE,
  );
  const levelResolution = resolutions[z];
  if (levelResolution === undefined) {
    return tileGrid;
  }

  const origin = tileGrid.getOrigin(z);
  const tileSize = tileGrid.getTileSize(z);

  // Not `instanceof`: ogc-client can bring its own copy of OpenLayers
  if ("getMatrixId" in tileGrid) {
    const wmtsGrid = tileGrid as WMTSTileGrid;
    const range = wmtsGrid.getFullTileRange(z);
    if (!range) {
      return tileGrid;
    }
    return new WMTSTileGrid({
      origin,
      resolutions: [levelResolution],
      matrixIds: [wmtsGrid.getMatrixId(z)],
      sizes: [[range.maxX + 1, range.maxY + 1]],
      tileSize,
    });
  }

  return new TileGrid({
    extent: tileGrid.getExtent() ?? undefined,
    origin,
    resolutions: [levelResolution],
    tileSize,
  });
}
