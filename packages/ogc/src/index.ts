// make the ambient types known to esbuild
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type * as Types from '@swissgeo/shared/ambient'

export * from './records'

import log, { LogLevel } from '@swissgeo/log'

// can't be inherited from the main package apparently
log.wantedLevels = [LogLevel.Debug, LogLevel.Info, LogLevel.Warn, LogLevel.Error]

// It only works when not doing a type import
// eslint-disable-next-line @typescript-eslint/consistent-type-exports
export * from '@/types/Records'
// eslint-disable-next-line @typescript-eslint/consistent-type-exports
export * from '@/types/Capabilities'
