import type { GetAppState } from "@swissgeo/statesharing";

import log from "@swissgeo/log";
import { ReadAppStateValidator } from "@swissgeo/statesharing";

export async function fetchStateFromStateId(
  stateId: string,
): Promise<GetAppState | null> {
  const { shareServiceUrl } = useRuntimeConfig().public;

  try {
    const data = await $fetch(
      `${shareServiceUrl}/${encodeURIComponent(stateId)}`,
    );
    return ReadAppStateValidator.parse(data);
  } catch (error) {
    log.error("Failed to get state", { error });
    return null;
  }
}
