import type { GetAppState } from "@swissgeo/statesharing";

export async function fetchStateFromStateId(
  stateId: string,
): Promise<GetAppState> {
  try {
    return await $fetch<GetAppState>(`/api/wpa/v1/state/${stateId}`);
  } catch {
    return null;
  }
}
