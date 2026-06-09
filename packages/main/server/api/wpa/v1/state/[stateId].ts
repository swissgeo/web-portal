import type { GetAppState } from "@swissgeo/statesharing";

import log from "@swissgeo/log";
import {
  APP_STATE_SERVICE_BASE_URL,
  getAppStateStateIdGet,
} from "@swissgeo/statesharing";

export default defineEventHandler(async (event): Promise<GetAppState> => {
  const stateId = getRouterParam(event, "stateId");

  if (!stateId) {
    throw createError({ statusCode: 400, statusMessage: "Missing stateId" });
  }

  log.debug(
    `Proxying GET state for stateId=${stateId} to ${APP_STATE_SERVICE_BASE_URL}`,
  );

  try {
    const { data } = await getAppStateStateIdGet({
      path: { state_id: stateId },
      throwOnError: true,
    });
    return data;
  } catch (error) {
    log.error("Failed to get state", { error });
    throw createError({
      statusCode: 502,
      statusMessage: "Failed to fetch state",
    });
  }
});
