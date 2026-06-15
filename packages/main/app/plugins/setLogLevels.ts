import log from "@swissgeo/log";
import parseWantedLogLevels from "~/utils/parseWantedLoglevels";

export default defineNuxtPlugin({
  name: "setLogLevels",

  hooks: {
    "app:created"() {
      const config = useRuntimeConfig();
      log.wantedLevels = parseWantedLogLevels(config.public.wantedLogLevels);
    },
  },
});
