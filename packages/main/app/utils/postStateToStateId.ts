import type { AppState, SaveAppStateResponse } from "@swissgeo/statesharing";

export async function postStateToStateId(
  state: AppState,
  options?: { signal?: AbortSignal },
): Promise<string | null> {
  try {
    const response = await $fetch<SaveAppStateResponse>("/api/wpa/v1/state", {
      method: "POST",
      body: { state },
      signal: options?.signal,
    });
    return response.id;
  } catch {
    return null;
  }
}
