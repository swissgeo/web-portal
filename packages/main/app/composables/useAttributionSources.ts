import type { Layer } from "@swissgeo/layers";
import type { MaybeRefOrGetter } from "vue";

import { computed, toValue } from "vue";

export interface AttributionSource {
  id: string;
  abbreviation: string;
  name: string;
  url?: string;
}

export function useAttributionSources(
  layers: MaybeRefOrGetter<Layer[]>,
  backgroundLayer: MaybeRefOrGetter<Layer | null>,
) {
  const mapViewStore = useMapViewStore();

  const sources = computed((): AttributionSource[] => {
    const resolvedLayers = toValue(layers);
    const resolvedBackground = toValue(backgroundLayer);

    const attributedLayers: Layer[] = [];

    if (
      resolvedBackground &&
      resolvedBackground.info?.attribution?.abbreviation
    ) {
      attributedLayers.push(resolvedBackground);
    }

    attributedLayers.push(
      ...resolvedLayers
        .filter(
          (layer) => mapViewStore.getMapLayerFromUuid(layer.uuid)?.isVisible,
        )
        .filter((layer) => !!layer.info?.attribution?.abbreviation),
    );

    return attributedLayers
      .map((layer) => {
        const attribution = layer.info?.attribution;
        if (!attribution?.abbreviation) {
          return null;
        }
        return {
          id: attribution.abbreviation.replace(/[._]/g, "-"),
          abbreviation: attribution.abbreviation,
          name: attribution.name,
          url: attribution.url,
        };
      })
      .filter((source) => source !== null)
      .filter(
        (source, index, array) =>
          array.findIndex((s) => s.abbreviation === source.abbreviation) ===
          index,
      ) as AttributionSource[];
  });

  return { sources };
}
