import log, { LogLevel } from '@swissgeo/log'

export default defineNitroPlugin((nitro) => {
    log.wantedLevels = [LogLevel.Debug, LogLevel.Info, LogLevel.Warn, LogLevel.Error]
})
