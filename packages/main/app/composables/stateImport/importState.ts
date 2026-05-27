import { StatePayloadValidator } from "@swissgeo/statesharing";

import type { AppStatePayload } from "~/composables/useStateConfig";

export async function importState(
  rawPayload: unknown,
  overrideZoomFromUrl?: number | null,
) {
  const { importState } = useStateConfig();

  const parsed = StatePayloadValidator.parse(
    (rawPayload as AppStatePayload)?.state ?? rawPayload,
  );

  const payload: AppStatePayload = {
    version:
      (rawPayload as AppStatePayload)?.version ?? APP_STATE_CONFIG_VERSION,
    state: parsed,
  };

  if (overrideZoomFromUrl) {
    payload.state.map = { ...payload.state.map, zoom: overrideZoomFromUrl };
  }

  await importState(payload);
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}
