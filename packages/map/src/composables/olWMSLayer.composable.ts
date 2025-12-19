import log from '@swissgeo/log'
import ImageLayer from 'ol/layer/Image'
import TileLayer from 'ol/layer/Tile'
import { ImageWMS, TileWMS } from 'ol/source'
import { TileGrid } from 'ol/tilegrid'

import useAddLayerToMap from '@/composables/useAddLayerToMap.composable'
import usePositionStore from '@/stores/position'

/**
 * Default tile size to use when requesting WMS tiles with our internal WMSs (512px)
 *
 * Comes from
 * {@link https://github.com/geoadmin/mf-geoadmin3/blob/master/src/components/map/TileGrid.js}
 */
// TODO move to better place
export const WMS_TILE_SIZE: number = 512 // px

export default function useOlWmsLayer(
    layerId: string,
    uuid: string,
    gutter: number,
    opacity: number,
    url: string,
    version: string,
    zIndex: number
) {
    const positionStore = usePositionStore()

    const format = computed(() => 'png') // format seems hardcoded in mapviewer, even though we
    // parse the capabilities to see if it's supported
    const lang = 'de' // TODO

    /**
     * Definition of all relevant URL param for our WMS backends. This is because both
     * https://openlayers.org/en/latest/apidoc/module-ol_source_TileWMS-TileWMS.html and
     * https://openlayers.org/en/latest/apidoc/module-ol_source_ImageWMS-ImageWMS.html have this
     * option.
     *
     * If we let the URL have all the param beforehand (sending all URL param through the url
     * option), most of our wanted params will be doubled, resulting in longer and more difficult to
     * read URLs
     */
    const wmsUrlParams = computed(() => {
        const params = {
            // SERVICE: "WMS",
            // REQUEST: "GetMap",
            TRANSPARENT: format.value === 'png',
            LAYERS: layerId,
            FORMAT: `image/${format.value}`,
            LANG: lang,
            VERSION: version,
            CRS: positionStore.projection.epsg,
            // TIME: timestamp.value,
        }
        // if (timestamp.value === ALL_YEARS_TIMESTAMP) {
        //   // To request all timestamp we need to set the TIME to undefined which will force openlayer
        //   // to send a request without TIME param, otherwise openlayer takes the previous TIME param.
        //   params.TIME = undefined;
        // }
        // if (urlParams.value) {
        //   params = { ...params, ...urlParams.value };
        // }
        return params
    })

    function createImageWMSSource(): ImageWMS {
        const config = {
            url: url,
            projection: positionStore.projection.epsg,
            params: wmsUrlParams.value,
            // Limiting image request to exactly the size of the map viewport.
            // We have a couple layers that state when they have lastly been updated at the bottom
            // of the WMS image, and without this ratio prop this label is out of the map viewport.
            // (e.g. ch.bazl.luftfahrthindernis)
            ratio: 1,
        }

        log.debug(`Set WMS Source "ImageWMS" for layer ${layerId} with config`, {
            messages: [config],
        })

        return new ImageWMS()
    }

    function createTileWMSSource(): TileWMS {
        const config = {
            projection: positionStore.projection.epsg,
            url: url,
            gutter: gutter,
            params: wmsUrlParams.value,
            tileGrid: !positionStore.projection.usesMercatorPyramid
                ? new TileGrid({
                      resolutions: positionStore.projection
                          .getResolutionSteps()
                          .map((step) => step.resolution),
                      extent: positionStore.projection.bounds?.flatten,
                      origin: positionStore.projection.getTileOrigin(),
                      tileSize: WMS_TILE_SIZE,
                  })
                : undefined,
        }
        log.debug(`Set WMS source "TileWMS" for ${layerId} with config`, { messages: [config] })

        return new TileWMS(config)
    }

    function createLayer() {
        let layer: TileLayer<TileWMS> | ImageLayer<ImageWMS>
        if (gutter !== -1) {
            layer = new TileLayer<TileWMS>({
                properties: {
                    id: layerId,
                    uuid,
                },
                opacity,
                source: createTileWMSSource(),
            })
        } else {
            layer = new ImageLayer<ImageWMS>({
                properties: {
                    id: layerId,
                    uuid,
                },
                opacity,
                source: createImageWMSSource(),
            })
        }
        return layer
    }

    const layer = createLayer()

    const { setVisibility, setZIndex } = useAddLayerToMap(layer, zIndex)

    return {
        setVisibility,
        setZIndex,
    }
}
