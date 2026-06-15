# swissgeo/layers

This is the package to hold a set of layers

## Intention

The app needs to know which layers are added to the map. This package provides the basics to track such a list of layers. At it's core it exists of a few [types](#Types),a basic [layer store](#Store) and some [utils](#Utils).

## Types

The types mostly boil down to one type: the `interface Layer`. We tried to simplify every possible type of layer to the bare minimum; at this level, we don't really care so much about what a layer consists of. It just contains some data, which will be processed by other parts of the project.

What's basically needed for a layer is the `data` and a `type` describing what is to be expected in `data`. Everything else is basically just a helping information to configure the app.

| Prop       | Explanation                                                                                                                         |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| type       | The type of Layer. Can either be 'dataset' or 'kml', 'kmx', 'gpx', 'geojson'. It describes that is in the `data` prop               |
| data       | The actual data. Is usually a string in case of file type layers or the dataset object in case of a layer coming from an OGC Record |
| uuid       | An internal uuid to be able to deterministically identify the object                                                                |
| humanId    | A human readable ID                                                                                                                 | This is usally used in log messages and similar, in order to be able to track the layer. This is field _is not_ unique, the same layer could be added to the map twice |
| isVisible  | If it's currently visible or not                                                                                                    |
| opacity    | The layer's opacity to be displayed on the map                                                                                      |
| info       | Some information such as the title, attribution etc. of the layer. Used i.e. when displaying the list of layers                     |
| isLoading  | currently unused                                                                                                                    |
| dimensions | (for WMS and WMTS only) Dimensions of the layer and the currently selected value                                                    |
| layerUrl   | The URL of the layer data. For dataset layers it's the URL to the dataset, for file layers it could be where the file resides       |

## Store

Simple list of layers. The order of the layers array determines the order on the map.

## Utils

`makeServerLayer` Utility to create a dataset type layer. Takes in a dataset, and has some default values set already.
