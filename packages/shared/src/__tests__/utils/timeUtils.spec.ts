import { describe, it, expect, test } from 'vitest'

import { ALL_YEARS_TIMESTAMP } from '@/globals'
import {
    convertYearToTimestamp,
    getDisplayNameFromTimestamp,
    getYearFromGeoadminValue,
} from '@/utils/timeUtils'

describe('Testing the display timestamp util function', () => {
    it.each`
        description                                                                                         | timestamp                     | displayedName
        ${'returns - when the timestamp given is null'}                                                     | ${null}                       | ${'-'}
        ${'returns - when the timestamp given is undefined'}                                                | ${undefined}                  | ${'-'}
        ${'returns ' + ALL_YEARS_TIMESTAMP + ' when the timestamp given starts with 9999'}                  | ${'999910102134'}             | ${ALL_YEARS_TIMESTAMP}
        ${'returns ' + ALL_YEARS_TIMESTAMP + ' when the timestamp given is already ' + ALL_YEARS_TIMESTAMP} | ${ALL_YEARS_TIMESTAMP}        | ${ALL_YEARS_TIMESTAMP}
        ${'returns a year if the date given is in the YYYYMMDD format'}                                     | ${'20120823'}                 | ${2012}
        ${'returns a year if we only give it a year'}                                                       | ${'2017'}                     | ${2017}
        ${'returns a year if we give it a date in a  YYYY-MM-DD format'}                                    | ${'2017-12-21'}               | ${2017}
        ${'returns a year if we give it a date in a  YYYY-MM-DDTHH:mm format'}                              | ${'2017-12-21T23:43'}         | ${2017}
        ${'returns a year if we give it a date in a  YYYY-MM-DDTHH:mm:ss format'}                           | ${'1883-12-21T23:45:12'}      | ${1883}
        ${'returns a year if we give it a date in a  YYYY-MM-DDTHH:mm:ss.sss format'}                       | ${'2011-12-21T23:45:17.123'}  | ${2011}
        ${'returns a year even if we give the date in a stupid full sentence format'}                       | ${'Le 12 Mars 1743'}          | ${1743}
        ${'returns unknown if it is not an expected value'}                                                 | ${'1923 zeppelins en France'} | ${'unknown'}
    `('$description', ({ _, timestamp, displayedName }) => {
        expect(getDisplayNameFromTimestamp(timestamp)).to.eql(displayedName)
    })
})

describe('Testing convertYearToTimestamp', () => {
    test('returns year as string if available values contain it directly', () => {
        expect(convertYearToTimestamp(['2016', '2019', '2023'], 2019)).toBe('2019')
    })

    test('returns the raw YYYYMMDD timestamp when year matches', () => {
        expect(convertYearToTimestamp(['20161231', '20191231', '20230101'], 2019)).toBe('20191231')
    })

    test('returns null if no matching timestamp found', () => {
        expect(convertYearToTimestamp(['2016', '2019'], 2023)).toBeNull()
    })
})

describe('Testing getYearFromGeoadminValue', () => {
    test.each([
        ['2016', '2016'],
        ['20190222', '2019'],
        ['2016-08-15', '2016'],
        ['2017-12-21T23:43', '2017'],
        ['all', undefined],
        ['not a date', undefined],
    ])('parses %s as %s', (timestamp, expectedYear) => {
        expect(getYearFromGeoadminValue(timestamp)).toEqual(expectedYear)
    })
})
