# swissgeo/ogc

This is the package to be able to work with the OGC API.

## Records

This package provides composables that enable the travelling of the OGC Records API:

| composable                  | description                                                                             | input                                                  | output                                               |
| --------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------- |
| `useDistributionCollection` | Grabs the distribution link (`rel = 'distributions'`) of a dataset and fetches its data | Dataset                                                | Collection of Distributions                          |
| `useDistribution`           | Returns a certain distribution of a distribution collection                             | Collection of Distributions, which distribution to get | A single distribution and the corresponding layer ID |
| `usePreferredDistribution`  | Extracts the preferred distribution of a dataset if specified                           | Dataset                                                | ID of the preferred distribution                     |
| `useService`                | Grabs the service link (`rel = 'service'`) from the distribution and fetches it         | Distribution                                           | Service                                              |
| `useCapabilities`           | Gets the capability url (`rel = 'about'`) of a distribution                             | Service                                                | URL to capabilities                                  |
| `useWmtsCapabilities`       | Fetches the capabilities of a WTMS and parses them to openlayers options and dimensions | Service                                                | Capabilities, Options and Dimensions                 |
| `useWmsCapabilities`        | Fetches the capabilities of a WMS and parses them to options and dimensions             | Service                                                | Capabilities, Dimensions                             |
| `useGeoJson`                | Grabs the URLs to GeoJSON data and fetches that                                         | Distribution                                           | GeoJSON Data and Style                               |
| `useStyle`                  | TBD                                                                                     |                                                        |                                                      |

All the composables expose their results as reactive properties and can thus be chained.

### Background

The OGC Records roughly have this structure (just schematically):

<pre>
DatasetCollection: Dataset[]
↳  DistributionCollection: Distribution []
   ↳  Service
      ↳  URL to capabilities
   ↳  URL to GeoJSON Data 
   ↳  Style
</pre>

The `types/Records` file in the source provides additional info on the structure of these records.
