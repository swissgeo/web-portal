import type { GetAppState } from "@swissgeo/statesharing";

import log from "@swissgeo/log";
import { ReadAppStateValidator } from "@swissgeo/statesharing";

export default defineEventHandler(async (event): Promise<GetAppState> => {
  const stateId = getRouterParam(event, "stateId");
  const config = useRuntimeConfig();

  if (!stateId) {
    throw createError({ statusCode: 400, statusMessage: "Missing stateId" });
  }

  log.debug(
    `Proxying GET state for stateId=${stateId} to ${config.shareServiceUrl}`,
  );

  try {
    const data = await $fetch<GetAppState>(
      `${config.shareServiceUrl}/${stateId}`,
      {
        method: "GET",
      },
    );

    const parsedData = ReadAppStateValidator.parse(data);

    return parsedData;
  } catch (error) {
    log.error("Failed to get state", { error });
    throw createError({
      statusCode: 502,
      statusMessage: "Failed to fetch state",
    });
  }
});
