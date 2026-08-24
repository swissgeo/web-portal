import type { FlatExtent } from "@swissgeo/shared";
import type { Feature as OlFeature, Map as OlMap } from "ol";
import type { Geometry } from "ol/geom";
import type VectorSource from "ol/source/Vector";
import type { Ref } from "vue";

import { GeoJSON } from "ol/format";
import { inject, onUnmounted, watch } from "vue";

import type { MapClickEvent } from "@/types";

const IDENTIFY_TOLERANCE_PX = 10;

/**
 * Narrows a layer source to one that can be queried for features by extent.
 *
 * instanceof VectorLayer is problematic to check, which is why we're not doing it.
 * When using instanceof, we encountered an issue where it would fail because the
 * instance of VectorLayer used to construct the drawings is not the same as the
 * one used to check (which is a possible limitation of a modular approach: we have
 * two instances of the same object, and they don't play nice.)
 *
 * Instead of that, we check that we can retrieve features directly from the map,
 * no matter the kind of Layer it is, or which instance created it..
 */
function isFeatureQueryableSource(source: unknown): source is VectorSource {
  return (
    typeof source === "object" &&
    source !== null &&
    typeof (source as VectorSource).forEachFeatureInExtent === "function"
  );
}

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
      // groups and mock layers don't expose getSource()
      if (typeof layer.getSource === "function") {
        const uuid = layer.get("uuid") as string | undefined;
        const source = layer.getSource();

        if (uuid && isFeatureQueryableSource(source)) {
          const featuresFoundInExtent: GeoJSON.Feature[] = [];

          // When we want to introduce vector tiles, we will have to use
          // source.getFeaturesInExtent on those layers instead of
          // source.forEachFeatureInExtent

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
