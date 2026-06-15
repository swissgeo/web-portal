import log, { LogPreDefinedColor } from "@swissgeo/log";

import { importState } from "./importState";
/**
 * Import a state from the session storage
 *
 * @returns Whether a state was imported
 */
export async function importStateFromSessionStorage(): Promise<boolean> {
  // Restore state from sessionStorage on load
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      await importState(JSON.parse(stored));
      log.info({
        title: "importStateFromSessionStorage",
        titleColor: LogPreDefinedColor.Sky,
        messages: ["Restored app state from sessionStorage"],
      });
      return true;
    }
  } catch (error) {
    log.warn({
      title: "importStateFromSessionStorage",
      titleColor: LogPreDefinedColor.Sky,
      messages: [
        "Failed to restore app state from sessionStorage, clearing stored state",
        String(error),
      ],
    });
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // sessionStorage not available, silently ignore
    }
  }
  return false;
}
