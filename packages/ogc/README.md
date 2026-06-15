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

All the composables expose their results as reactive properties and can thus be chained (or actually, composed) together.

### OGC Background

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

## Composition examples

The idea is that the composables can be sort of composed "freely" together. Freely is in apostrophe because they of course often depend on each other; the result of one composable is fed into another one. Yet the user of these compositions can decide themselves how far they want to use the data.

Here are a few pseudo-code examples

```js
// getting just the capabilities for a WMTS layer
distributionCollection = useDistributionCollection(dataset);
distribution = useDistribution(distributionCollection);
service = useService(distribution);
capabilities = useWmtsCapabilities(service);

// getting the capabilities AND the style for a wmts layer
distributionCollection = useDistributionCollection(dataset);
distribution = useDistribution(distributionCollection);
style = useStyle(distribution);
service = useService(distribution);
capabilities = useWmtsCapabilities(service);
```

The latter example showcases how both `useStyle` and `useService` are direct consumers of the distribution data. Yet the `distribution` needs only be fetched once.

The power of this setup lies in the **reactivity**: there is no need to manage whether the data is updated or not, whether other data needs to be refetched or not. If for some reason the `dataset` changes, but the `useDistributionCollection` returns the same data from the API, then the rest won't be updated
