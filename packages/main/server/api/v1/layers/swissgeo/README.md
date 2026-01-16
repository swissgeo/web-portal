# Swissgeo API Routes

There are several routes here to provide the necessary data to add swissgeo layers to the map

## Custom endpoints

### `catalog.ts`

This is the entry point. It will probably be mainly useful for debugging. This provides the entire swissgeo catalog as OGC Record.

_Why will this go away_

In the future, the user workflow for adding layers won't be to select them from a list but instead it will be search results. There's no need
(and indeed, it's probably even useless) for an entire catalog for the frontend!

### `distributionData/[layerId].ts?protocol=[OGC:WMTS|OGC:WM]`

This endpoint will take the ID of a layer and with that will follow the records structure to grab the necessary info for displaying
a layer on the map.

This will return to the frontend an object containing the URL to the capability server, style data, etc. whatever is expected
by the frontend. This endpoint is thus tightly coupled to the implementation of the frontend.
Also see `useLayerData.composable.ts` in the map packages.

## Proxy Endpoints

These endpoints serve as a mean to deliver the data from the ogc records, which are currently files in the repo,
to a http client. They mostly just pass through the data.

These endpoints replace the href of `links` so that they will point back to this API.

### `swissgeo/collections/[distributionId].ts`

Return the **distribution** collection of one datset. The data will be taken from the single
files in the folder structure.

### `swissgeo/collections/swissgeo.catalog/items/[datasetId].ts`

Return the collection of one specific **dataset**. This will grab the data from the catalog.
The path is structured in the same way as it is encoded in the links section of a dataset

### `swissgeo/collections/geoadmin.services/items/[serviceId].ts`

Proxies the delivery of a **service** record. The path is structued in the same way as the
link with `rel` = `styledBy` of a distribution.

### `styles/[styleId].ts`

Proxies the delivery of a style record. The path is structued in the same way as the
link with `rel` = `styledBy` of a distribution.

## External layer endpoints

This might seem a little peculiar, but we provide some endpoints that mock the behaviour we have implemented
for the records, but for external data.
If a user provides a URL to a WMTS for example, we can use the exact same workflow in the frontend to retrieve
the data and display the layers as we do for the ones based on records.

### `geojson/`

TBD

## Temporary endpoints

### `vectorTest.ts` and `vectorTilesTest.ts`

Just intermediary solutions to deliver the vector data for testing
