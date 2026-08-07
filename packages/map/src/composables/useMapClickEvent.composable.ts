import type { FlatExtent } from "@swissgeo/shared";
import type { Feature as OlFeature, Map as OlMap } from "ol";
import type { Geometry } from "ol/geom";
import type VectorSource from "ol/source/Vector";
import type { Ref } from "vue";

import { GeoJSON } from "ol/format";
import VectorLayer from "ol/layer/Vector";
import { inject, onUnmounted, watch } from "vue";

import type { MapClickEvent } from "@/types";

const IDENTIFY_TOLERANCE_PX = 10;

export function useMapClickEvent(onClick: (evt: MapClickEvent) => void): void {
  const olMap = inject<Ref<OlMap | undefined>>("olMap");
  const format = new GeoJSON();

  let cleanup: (() => void) | null = null;

  const handler = (olEvent: { coordinate: number[]; pixel: number[] }) => {
    const map: OlMap | undefined = olMap?.value;

    if (!map) {
      return;
    }

    const resolution = map.getView().getResolution();
    if (resolution === undefined) {
      return;
    }

    const halfBox = IDENTIFY_TOLERANCE_PX * resolution;
    const [x, y] = olEvent.coordinate as [number, number];
    const extent: FlatExtent = [
      x - halfBox,
      y - halfBox,
      x + halfBox,
      y + halfBox,
    ];

    const vectorFeaturesPerLayer: Record<string, GeoJSON.Feature[]> = {};

    for (const layer of map.getAllLayers()) {
      if (layer instanceof VectorLayer) {
        const uuid = layer.get("uuid") as string | undefined;
        const source: VectorSource | null = layer.getSource();

        if (uuid && source) {
          const featuresFoundInExtent: GeoJSON.Feature[] = [];

          source.forEachFeatureInExtent(
            extent,
            (feature: OlFeature<Geometry>) => {
              const json = format.writeFeatureObject(feature);
              if (json) {
                featuresFoundInExtent.push(json);
              }
            },
          );

          if (featuresFoundInExtent.length > 0) {
            vectorFeaturesPerLayer[uuid] = featuresFoundInExtent;
          }
        }
      }
    }

    const size = map.getSize() ?? [0, 0];

    onClick({
      coordinate: [x, y],
      pixel: olEvent.pixel as [number, number],
      extent,
      viewportSize: [size[0], size[1]],
      vectorFeaturesPerLayer,
    });
  };

  watch(
    () => olMap?.value,
    (map) => {
      cleanup?.();
      if (!map) {
        return;
      }
      map.on("singleclick", handler);
      cleanup = () => map.un("singleclick", handler);
    },
    { immediate: true },
  );

  onUnmounted(() => cleanup?.());
}
