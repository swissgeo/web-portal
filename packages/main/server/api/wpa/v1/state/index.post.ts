import type { SaveAppState } from "@swissgeo/statesharing";

import log from "@swissgeo/log";
import { SaveAppStateResponse } from "@swissgeo/statesharing";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody<SaveAppState>(event);

  log.debug(`Proxying POST state to ${config.shareServiceUrl}`);

  try {
    const data = await $fetch<unknown>(config.shareServiceUrl, {
      method: "POST",
      body,
    });
    return SaveAppStateResponse.parse(data);
  } catch {
    throw createError({
      statusCode: 502,
      statusMessage: "Failed to save state",
    });
  }
});
