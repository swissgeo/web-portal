import type { SaveAppState } from "@swissgeo/statesharing";

import log from "@swissgeo/log";
import { postAppStatePost } from "@swissgeo/statesharing";

import { stateSharingClient as client } from "../../../../utils/state-sharing-client";

export default defineEventHandler(async (event) => {
  const body = await readBody<SaveAppState>(event);

  log.debug(`Proxying POST state to ${client.getConfig().baseUrl}`);

  try {
    const { data } = await postAppStatePost({
      client,
      body,
      throwOnError: true,
    });
    return data;
  } catch (error) {
    log.error("Failed to save state", { error });
    throw createError({
      statusCode: 502,
      statusMessage: "Failed to save state",
    });
  }
});
