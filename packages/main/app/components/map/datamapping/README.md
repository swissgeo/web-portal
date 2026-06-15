# Layer to Map Converter

## What this is

This folder here concerns itself with mapping or converting the layer data from the source to something digestible by the map module (and inherently, openlayers)

## How it works

The first challenge of the OGC records is that they require several API calls to fully get all the necessary data.
The second challenge of the OGC records is that, depending on the display format, different information needs to be fetched.

We're solving these here by using components that act as "containers" for each layer to be "converted". As soon as a layer gets added to the store, a "container" is rendered.
These containers contain the necessary code that will then solve above problems. The OGC package `@swissgeo/ogc` exposes the "traversal" of these records with a bunch of composables, each having it's specific task, for instance _fetch the distribution collection from a dataset_

These composables all take and return reactive data. This allows for composing the necessary composables together to retrieve the data. See the README in `@swissgeo/ogc` for examples.

These components are a bit special: they don't really render anything, they just hold the necessary data. This was chosen from how Vue.js is built, which doesn't really have a concept of an object instance like in OOP, but instead has the components.

## Reactivity

The setup is fully reactive.

## File and Dataset

There are two main entrypoints to this: `OgcDatasetConverter.vue` and `FileConverter.vue`. The first one concerts itself, as the name suggest, to convert an OGC dataset into openlayers data. The second one merely maps the layer data from the source to a datastructure used by the map module.

## Externally-imported WMS / WMTS layers (the "fake dataset" hack)

Internal layers come from the OGC API catalog and arrive as proper `Dataset` records (with `self` and `distributions` links). Externally-imported layers — those harvested by `ImportLayersPanel.vue` from a raw WMS/WMTS `GetCapabilities` document — do **not** have such a record.

To keep a single pipeline for both cases, `ImportLayersPanel.addLayer()` fabricates a synthetic `Dataset` whose `self` and `distributions` links point at our own server routes:

- `/api/wpa/v1/layers/external/dataset/<encodedCapabilityUrl>/<layerId>` → synthesises a `Dataset`
- `/api/wpa/v1/layers/external/<encodedCapabilityUrl>/<layerId>` → synthesises a `Distribution` collection

These routes parse the upstream capabilities document on demand and return OGC-API-shaped JSON so the rest of `datamapping/` cannot tell the difference between an internal and an external layer.

This is a deliberate hack and is documented here so it can either be kept knowingly or revisited later.
