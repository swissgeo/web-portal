import { describe, expect, it } from 'vitest'

import parseWantedLogLevels from '../parseWantedLoglevels'

describe('parseWantedLogLevels', () => {
    it.each([
        ['Error', [0]],
        ['Warn', [1]],
        ['Info', [2]],
        ['Debug', [3]],
        ['Error,Warn', [0, 1]],
        ['Error,Warn,Info', [0, 1, 2]],
        ['Error,Warn,Info,Debug', [0, 1, 2, 3]],
    ] as [string, number[]][])('parses correctly the levels', (input: string, output: number[]) => {
        const logLevels = parseWantedLogLevels(input)
        expect(logLevels).toEqual(output)
    })

    it('can deal with all cases', () => {
        expect(parseWantedLogLevels('ErrOr')).toEqual([0])
        expect(parseWantedLogLevels('error')).toEqual([0])
        expect(parseWantedLogLevels('ERROR')).toEqual([0])
        expect(parseWantedLogLevels('eRROR')).toEqual([0])
        expect(parseWantedLogLevels('eRROR')).toEqual([0])
    })

    it('can deal with weird whitespacing', () => {
        expect(parseWantedLogLevels('error ')).toEqual([0])
        expect(parseWantedLogLevels(' error ')).toEqual([0])
        expect(parseWantedLogLevels('     error')).toEqual([0])
        expect(parseWantedLogLevels('error, warn')).toEqual([0, 1])
        expect(parseWantedLogLevels(' error,    warn,debug')).toEqual([0, 1, 3])
    })

    it('ignores unknown log levels', () => {
        expect(parseWantedLogLevels('eRROR,unknown')).toEqual([0])
        expect(parseWantedLogLevels('eRROR,debug,deb0rk')).toEqual([0, 3])
    })
})
