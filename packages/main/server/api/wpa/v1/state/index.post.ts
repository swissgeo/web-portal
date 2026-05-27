import { SaveAppStateResponse, SaveAppStateValidator } from "@swissgeo/statesharing";
import type { SaveAppState } from "@swissgeo/statesharing";
import { createError, readBody } from "h3";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody<SaveAppState>(event);

  const parsed = SaveAppStateValidator.safeParse(body);
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: "Invalid request body" });
  }

  const data = await $fetch<unknown>(`${config.shareServiceUrl}/`, {
    method: "POST",
    body: parsed.data,
  });

  return SaveAppStateResponse.parse(data);
});
