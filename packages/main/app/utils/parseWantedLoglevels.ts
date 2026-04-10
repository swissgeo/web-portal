import { LogLevel } from '@swissgeo/log'

/**
 * Mapping strings like Error, debug etc. to LogLevels exposed by @swissgeo/log
 *
 * At some point this should probably be switched to union types, but until we have
 * ported that package to this code base, we'll leave it as that
 */
export default function parseWantedLogLevels(wantedLogLevels: string[]) {
    // Create an enumerated array where the keys are lowercase
    const possibleLevels = Object.entries(LogLevel).map(([level, value]) => [
        level.toLowerCase(),
        value,
    ])
    const sanitizedWantedLoglevels = wantedLogLevels.map((level) => level.toLowerCase())

    const wantedLevels = []
    for (const level of sanitizedWantedLoglevels) {
        const value = possibleLevels.find(([possibleLevel, _]) => possibleLevel === level)
        if (value) {
            wantedLevels.push(value[1] as LogLevel)
        } else {
            // Allow the console.warn here because we're only initializing the log levels at this point
            // eslint-disable-next-line no-console
            console.warn(`Wanted log level ${level} is an invalid value`)
        }
    }
    return wantedLevels
}
