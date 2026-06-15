import { createClient, createConfig } from "@swissgeo/statesharing";

const config = useRuntimeConfig();

export const stateSharingClient = createClient(
  createConfig({
    baseUrl: config.shareServiceUrl,
  }),
);
