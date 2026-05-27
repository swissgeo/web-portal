import type { GetAppState } from "@swissgeo/statesharing";

import { getAppStateStateIdGet } from "@swissgeo/statesharing";

export async function fetchStateFromStateId(
  stateId: string,
): Promise<GetAppState | null> {
  const response = await getAppStateStateIdGet(stateId);

  if (response.status !== 200) {
    return null;
  }

  return response.data;
}
