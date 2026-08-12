import { useIconsStore } from "@swissgeo/drawing";

export default defineNuxtPlugin({
  name: "icons",
  dependsOn: ["pinia"],

  async setup() {
    const runtimeConfig = useRuntimeConfig(); // Ensure runtime config is available before using it
    const iconsStore = useIconsStore();
    await iconsStore.loadIconSets(runtimeConfig.public.iconServiceEndpoint);
  },
});
