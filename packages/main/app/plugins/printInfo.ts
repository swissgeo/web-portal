export default defineNuxtPlugin({
  name: "printAppInfo",

  hooks: {
    "app:created"() {
      const config = useRuntimeConfig();

      const version = config.public.version;
      const buildTime = config.public.buildTime;

      const log = (
        msg: string,
        style: string = "color: #1f576b; font-size: 1.2rem;",
      ) =>
        // eslint-disable-next-line no-console
        console.log(`%c${msg}`, style);
      log("SWISSGEO", "color: #1f576b;; font-weight: bold; font-size: 2rem;");
      log(`Version: ${version}`);
      log(`Build Time: ${buildTime}`);
    },
  },
});
