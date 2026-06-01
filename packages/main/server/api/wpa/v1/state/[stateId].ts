import type { GetAppState } from "@swissgeo/statesharing";

import log from "@swissgeo/log";
import { ReadAppStateValidator } from "@swissgeo/statesharing";

export default defineEventHandler(async (event): Promise<GetAppState> => {
  const config = useRuntimeConfig();
  const stateId = getRouterParam(event, "stateId");

  if (!stateId) {
    throw createError({ statusCode: 400, statusMessage: "Missing stateId" });
  }

  log.debug(`Proxying GET state for stateId=${stateId}`);

  try {
    const data = await $fetch<unknown>(`${config.shareServiceUrl}/${stateId}`);
    return ReadAppStateValidator.parse(data);
  } catch {
    throw createError({
      statusCode: 502,
      statusMessage: "Failed to fetch state",
    });
  }
});
