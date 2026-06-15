import type { SaveAppState } from "@swissgeo/statesharing";

import log from "@swissgeo/log";
import { SaveAppStateResponseValidator } from "@swissgeo/statesharing";

export default defineEventHandler(async (event) => {
  const body = await readBody<SaveAppState>(event);
  const config = useRuntimeConfig();

  log.debug(`Proxying POST state to ${config.shareServiceUrl}`);

  try {
    const data = await $fetch(`${config.shareServiceUrl}/`, {
      method: "POST",
      body,
    });

    const parsedData = SaveAppStateResponseValidator.parse(data);

    return parsedData;
  } catch (error) {
    log.error("Failed to save state", { error });
    throw createError({
      statusCode: 502,
      statusMessage: "Failed to save state",
    });
  }
});
