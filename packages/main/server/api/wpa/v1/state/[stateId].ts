import { ReadAppStateValidator } from "@swissgeo/statesharing";
import { createError, getRouterParam } from "h3";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const stateId = getRouterParam(event, "stateId");

  if (!stateId) {
    throw createError({ statusCode: 400, statusMessage: "Missing stateId" });
  }

  const data = await $fetch<unknown>(
    `${config.shareServiceUrl}/${stateId}`,
  ).catch(() => {
    throw createError({ statusCode: 404, statusMessage: "State not found" });
  });

  return ReadAppStateValidator.parse(data);
});
