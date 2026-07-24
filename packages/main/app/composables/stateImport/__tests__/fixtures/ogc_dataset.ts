export const datasetResponse = {
  id: "ch.bafu.wald-foehnhaeufigkeit_jahr",
  links: [
    {
      href: "https://services.dev.sgdi.tech/api/oar/staticv2/collections/swissgeo.catalog/items/ch.bafu.wald-foehnhaeufigkeit_jahr?language=en",
      rel: "self",
      title: "This Record",
      type: "application/json",
      hreflang: "en",
    },
    {
      href: "https://services.dev.sgdi.tech/api/oar/staticv2/collections/swissgeo.catalog?language=en",
      rel: "collection",
      title: "Link to the collection this item belongs to",
      type: "application/json",
      hreflang: "en",
    },
    {
      href: "https://services.dev.sgdi.tech/api/oar/staticv2/collections/ch.bafu.wald-foehnhaeufigkeit_jahr.distributions/items",
      rel: "distributions",
      title: "Distributions",
      type: "application/json",
    },
    {
      href: "https://www.geocat.ch/geonetwork/srv/eng/catalog.search#/metadata/12e6b1d6-b517-4919-b04c-5196947ac760",
      rel: "alternate",
      title: "GeoCat Metadata",
      type: "application/json",
    },
  ],
  linkTemplates: [],
  type: "Feature",
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [5.96, 45.82],
        [5.96, 47.81],
        [10.49, 47.81],
        [10.49, 45.82],
        [5.96, 45.82],
      ],
    ],
  },
  properties: {
    contacts: [
      {
        organization: "Forest Division, Federal Office of the Environment",
        country: "CH",
        role: "owner",
      },
    ],
    description:
      "The map shows the average frequency (in %) of the number of Föhn hours per year. A value of e.g. 12 % means that on 44 days in the year the Föhn blows, whereby the duration of the Föhn events varies. The climate stations of MeteoSwiss in the Föhn regions were used as the basis for the calculation (different time periods). For each station the number of hours with Föhn per day was calculated. The criteria for Föhn were as follows:- Relative humidity: during the day < 50 %, at night < 55 %, - Wind speed: > 5 km/h, - Wind direction range: typical wind direction (in °) with Föhn +/- 60°. The evaluations at the stations were then interpolated into the area for the typical Föhn regions. The grey-coloured regions are not considered typical Föhn regions. The frequency of Föhn was not calculated for these regions. The resulting map has a spatial resolution of 25 m x 25 m. It was used for modelling altitudinal belts of forest vegetation.",
    language: {
      code: "en",
      name: "English",
      dir: "ltr",
    },
    languages: [
      {
        code: "de",
        name: "Deutsch",
        dir: "ltr",
        alternate: "German",
      },
      {
        code: "fr",
        name: "Français",
        dir: "ltr",
        alternate: "French",
      },
      {
        code: "it",
        name: "Italiano",
        dir: "ltr",
        alternate: "Italian",
      },
      {
        code: "en",
        name: "English",
        dir: "ltr",
      },
    ],
    preferredDistributionId: "ch.bafu.wald-foehnhaeufigkeit_jahr:wmts",
    title: "Frequency of Föhn in the year, period variable (maximum 1969-2013)",
    type: "Dataset",
  },
};
