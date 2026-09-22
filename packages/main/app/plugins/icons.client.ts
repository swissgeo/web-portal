import { useIconsStore } from "@swissgeo/drawing";

export default defineNuxtPlugin({
  name: "icons",
  dependsOn: ["pinia"],

  setup() {
    const runtimeConfig = useRuntimeConfig(); // Ensure runtime config is available before using it
    const iconsStore = useIconsStore();
    // Drawing icons must not block application startup.
    void iconsStore.loadIconSets(runtimeConfig.public.iconServiceEndpoint);
  },
});
