import type { Page } from "@playwright/test";

/**
 * Wait for openlayers to trigger the event moveend event
 *
 * The event is triggered after the map is moved.
 */
export async function waitForMoveEnd(page: Page): Promise<void> {
  return await page.evaluate(() => {
    return new Promise<void>((resolve) => {
      window.swissgeoOlMap?.once("moveend", () => resolve());
    });
  });
}

/**
 * Wait for openlayers to trigger the loadend event
 *
 * The event is triggered when loading of additional map data has completed.
 */
export async function waitForMapLoad(page: Page): Promise<void> {
  return await page.evaluate(() => {
    return new Promise<void>((resolve) => {
      window.swissgeoOlMap?.once("loadend", () => resolve());
    });
  });
}

/**
 * Wait for openlayers to finish the zooming
 */
export async function waitForZoom(page: Page): Promise<void> {
  return waitForMoveEnd(page);
}
