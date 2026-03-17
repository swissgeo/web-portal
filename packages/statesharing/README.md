# State Sharing Module

## Purpose

The State Sharing Module's goal is to provide the app with a way to handle the conservation of the app's state, either with other parties, or when one would like to reload the app itself.

In its current state, this module only serves as a validation tool called within the main module.

## Dependencies

| module             | provides                                                                                                                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@swissgeo/shared` | The App State Config and Layer State config types, the App state config version, the EPSG:2056 bounding box, the function to verify that a given JSON is a valid app state configuration JSON |

## Exposed Members

| function           | description                                                           | input                         | output                                                        |
| ------------------ | --------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------- |
| `validateAppState` | Verify the typing and content of the app state and ensure it is valid | Any JSON item given by a user | an `Error` if the state is not valid, the same JSON otherwise |

## internal Members

those validation function are helped by the `isInstanceOfAppStateConfig` function, which already makes all type checks, so there is not much more to validate. In the future, we might need to validate more parameters within a layer or the map.

| function        | description                                                  | input                              | output                                          |
| --------------- | ------------------------------------------------------------ | ---------------------------------- | ----------------------------------------------- |
| `validateMap`   | validate that the map's center coordinates are within bounds | the JSON `map` property            | an `Error` if the map is not valid              |
| `validateLayer` | validate that the layer's opacity is between 0 and 1         | a Layer state configuration Object | an Error if the opacity is set to a wrong value |
