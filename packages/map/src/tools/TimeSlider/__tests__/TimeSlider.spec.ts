import type { Layer } from '@swissgeo/layers'

import { expect, test } from 'vitest'

import * as TimeSliderUtils from '../timeSliderUtils.ts'

const BASE_LAYER_CONFIG: Layer = {
    uuid: 'abc',
    humanId: 'def',
    isVisible: true,
    type: 'wms',
    opacity: 0,
    isLoading: false,
    zIndex: 0,
}

test.each([
    ['2016', '2016'],
    ['all', undefined],
    ['20190222', '2019'],
    ['2016-08-15', '2016'],
])('The years parser for WMTS style years parses correctly', (timestamp, expectedYear) => {
    const year = TimeSliderUtils.getYearFromCustomGeoadminValue(timestamp)
    expect(year).toEqual(expectedYear)
})

test('The years data getter returns the correct data', () => {
    const layers: TimeSliderUtils.LayerWithTime[] = [
        {
            ...BASE_LAYER_CONFIG,
            dimensions: {
                time: {
                    currentValue: '2026',
                    availableValues: ['2019', '2026', '2016', '1987'],
                },
            },
        },
        {
            ...BASE_LAYER_CONFIG,
            dimensions: {
                time: {
                    currentValue: '2026',
                    availableValues: ['2026', '2025', '2019', '2016'],
                },
            },
        },
        {
            ...BASE_LAYER_CONFIG,
            dimensions: {
                time: {
                    currentValue: '2026',
                    availableValues: ['2025', '2019', '2016'],
                },
            },
        },
    ]
    const { yearsJoint, yearsSeparate } = TimeSliderUtils.getYearsWithData(layers)
    expect(yearsJoint).toEqual([2016, 2019])
    expect(yearsSeparate).toEqual([1987, 2025, 2026])
})

test('TimeSlider works with one particular WMS timevalue Example', () => {
    const layers: TimeSliderUtils.LayerWithTime[] = [
        {
            ...BASE_LAYER_CONFIG,
            dimensions: {
                time: {
                    currentValue: '99990101',
                    // 2021, 2020, 2019, 2016
                    availableValues: [
                        '99990101',
                        '20240101',
                        '20230101',
                        '20220101',
                        '20210101',
                        '20200101',
                        '20190101',
                        '20180101',
                        '20170101',
                        '20160101',
                        '20150101',
                        '20140101',
                        '20130101',
                        '20120101',
                        '20110101',
                    ],
                },
            },
        },
    ]
    const { yearsJoint, yearsSeparate } = TimeSliderUtils.getYearsWithData(layers)
    expect(yearsJoint).toEqual([
        2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024,
    ])
    expect(yearsSeparate).toEqual([])
})

test('The years getter filters the correct data with WMTS timestamps', () => {
    const layers: TimeSliderUtils.LayerWithTime[] = [
        {
            ...BASE_LAYER_CONFIG,
            dimensions: {
                time: {
                    currentValue: '2026',
                    availableValues: ['2019', '2026', '2016', '1987'],
                },
            },
        },
        {
            ...BASE_LAYER_CONFIG,
            dimensions: {
                time: {
                    currentValue: '2026',
                    // 2021, 2020, 2019, 2016
                    availableValues: ['20211231', '20201231', '20191231', '20161231'],
                },
            },
        },
    ]
    const { yearsJoint, yearsSeparate } = TimeSliderUtils.getYearsWithData(layers)
    expect(yearsJoint).toEqual([2016, 2019])
    expect(yearsSeparate).toEqual([1987, 2020, 2021, 2026])
})

test('The years getter filters with "all" included', () => {
    const layers: TimeSliderUtils.LayerWithTime[] = [
        {
            ...BASE_LAYER_CONFIG,
            dimensions: {
                time: {
                    currentValue: '2026',
                    availableValues: ['2019', '2026', '2016', '1987', 'all'],
                },
            },
        },
        {
            ...BASE_LAYER_CONFIG,
            dimensions: {
                time: {
                    currentValue: '2026',
                    // 2021, 2020, 2019, 2016
                    availableValues: ['20211231', '20201231', '20191231', '20161231', 'all'],
                },
            },
        },
    ]
    const { yearsJoint, yearsSeparate } = TimeSliderUtils.getYearsWithData(layers)
    expect(yearsJoint).toEqual([2016, 2019])
    expect(yearsSeparate).toEqual([1987, 2020, 2021, 2026])
})
