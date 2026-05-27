import { SaveAppStateResponse } from "@swissgeo/statesharing";
import type { SaveAppState } from "@swissgeo/statesharing";
import { createError, readBody } from "h3";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody<SaveAppState>(event);

  const data = await $fetch<unknown>(`${config.shareServiceUrl}/`, {
    method: "POST",
    body,
  }).catch(() => {
    throw createError({ statusCode: 502, statusMessage: "Failed to save state" });
  });

  return SaveAppStateResponse.parse(data);
});
