import log, { LogLevel } from "@swissgeo/log";

export default defineNitroPlugin(() => {
  log.wantedLevels = [
    LogLevel.Debug,
    LogLevel.Info,
    LogLevel.Warn,
    LogLevel.Error,
  ];
});
