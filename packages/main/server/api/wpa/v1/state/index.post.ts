import type { SaveAppState } from "@swissgeo/statesharing";

import log from "@swissgeo/log";
import {
  APP_STATE_SERVICE_BASE_URL,
  postAppStatePost,
} from "@swissgeo/statesharing";

export default defineEventHandler(async (event) => {
  const body = await readBody<SaveAppState>(event);

  log.debug(`Proxying POST state to ${APP_STATE_SERVICE_BASE_URL}`);

  try {
    const { data } = await postAppStatePost({ body, throwOnError: true });
    return data;
  } catch (error) {
    log.error("Failed to save state", { error });
    throw createError({
      statusCode: 502,
      statusMessage: "Failed to save state",
    });
  }
});
