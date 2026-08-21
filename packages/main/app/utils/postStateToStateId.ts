import type { AppState } from "@swissgeo/statesharing";

import log from "@swissgeo/log";
import { SaveAppStateResponseValidator } from "@swissgeo/statesharing";

export async function postStateToStateId(
  state: AppState,
  options?: { signal?: AbortSignal },
): Promise<string | null> {
  const { shareServiceUrl } = useRuntimeConfig().public;

  try {
    const data = await $fetch(`${shareServiceUrl}/`, {
      method: "POST",
      body: { state },
      signal: options?.signal,
    });
    return SaveAppStateResponseValidator.parse(data).id;
  } catch (error) {
    log.error("Failed to save state", { error });
    return null;
  }
}
