import type { Layer, LayerAttribution } from "@swissgeo/layers";
import type { MaybeRefOrGetter } from "vue";

import { computed, toValue } from "vue";

export function useAttributionSources(
  layers: MaybeRefOrGetter<Layer[]>,
  backgroundLayer: MaybeRefOrGetter<Layer | null>,
) {
  const mapViewStore = useMapViewStore();

  const sources = computed((): LayerAttribution[] => {
    const visibleLayers = toValue(layers).filter(
      (layer) => mapViewStore.getMapLayerFromUuid(layer.uuid)?.isVisible,
    );

    return [toValue(backgroundLayer), ...visibleLayers]
      .map((layer) => layer?.info?.attribution)
      .filter(
        (attribution): attribution is LayerAttribution =>
          !!attribution?.abbreviation,
      )
      .filter(
        (attribution, index, array) =>
          array.findIndex(
            (a) => a.abbreviation === attribution.abbreviation,
          ) === index,
      );
  });

  return { sources };
}
