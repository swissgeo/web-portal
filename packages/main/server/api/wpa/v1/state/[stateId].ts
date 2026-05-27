import type { GetAppState } from "@swissgeo/statesharing";

import { ReadAppStateValidator } from "@swissgeo/statesharing";

export default defineEventHandler(async (event): Promise<GetAppState> => {
  const config = useRuntimeConfig();
  const stateId = getRouterParam(event, "stateId");

  if (!stateId) {
    throw createError({ statusCode: 400, statusMessage: "Missing stateId" });
  }

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
