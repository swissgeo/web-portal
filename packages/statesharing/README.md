# State Sharing Module

## Purpose

The State Sharing Module's goal is to provide the app with a way to handle the conservation of the app's state, either with other parties, or when one would like to reload the app itself.

In its current state, this module only serves as a validation tool called within the main module.

In its final state, this module will handle all operations regarding sharing and importing the state of the application

## Dependencies

| module             | provides                                 |
| ------------------ | ---------------------------------------- |
| `@swissgeo/shared` | The bounding box for the LV95 projection |

## Exposed Members

| member                             | type     | description                                                           |
| ---------------------------------- | -------- | --------------------------------------------------------------------- |
| `validateAndPrepareAppStateConfig` | function | Verify the typing and content of the app state and ensure it is valid |
| `AppStateConfig`                   | type     | A representation of the state of the entire application               |
| `LayerStateConfig`                 | type     | A representation of the state of a single layer                       |
| `APP_STATE_CONFIG_VERSION`         | constant | The current version of the state sharing tool, as a semver float.     |

## internal Members

those are validation functions and constants used in such validation functions. They should not be exposed to other modules, as this is this module's job to validate, serialize and deserialize the state.

| member                         | type     | description                                                                                                     |
| ------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------- |
| `validateAppState`             | function | Check the version and call all other validators to ensure the AppStateConfig is correct                         |
| `isInstanceOfAppStateConfig`   | function | Checks that the given object fits the `AppStateConfig` interface requirements (attributes and correct typing)   |
| `isInstanceOfLayerStateConfig` | function | Checks that the given object fits the `LayerStateConfig` interface requirements (attributes and correct typing) |
| `validateMap`                  | function | validate that the map's center coordinates are within bounds                                                    |
| `validateLayer`                | function | validate that the layer's opacity is between 0 and 1                                                            |
| `layerStateConfigKeys`         | constant | constant used to store the layer state config attributes keys to check that we are not allowing wrong keys      |
| `validAppStateConfigKeys`      | constant | constant used to store the app state config attributes keys to check that we are not allowing wrong keys        |
