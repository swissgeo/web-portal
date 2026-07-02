import type { Dataset } from "@swissgeo/ogc";

import log, { LogPreDefinedColor } from "@swissgeo/log";
import { defineStore } from "pinia";
import { ref, markRaw } from "vue";

import type { Dimension, DimensionId, Layer, LayerInfo } from "@/index";

/**
 * Quick explanation on this interface:
 *  Right now, we have a distinction between
 *  - the source for layers, which tells the application where to look for the tiles / data
 *  - The map layers, which contains the information openlayers need to render the layers
 *
 * the visibility and opacity do not belong in the sources, but we do not want them to be overwritten by the
 * styling that happens on the first pass through the conversion pipeline
 *
 * These options are kept in the state on importing until the conversion pipeline is finished, then they are applied to the map layers and removed.
 * Once the importOptions object is empty, we know the import has been completed.
 */
interface importOption {
  isVisible?: boolean;
  opacity?: number;
}

export const useLayerStore = defineStore("layers", () => {
  /** List of layers added to the map. Index 0 = bottom of stack, last index = top. */
  const layers = ref<Layer[]>([]);

  /** The active background layer, or null if none is selected. */
  const backgroundLayer = ref<Layer | null>(null);

  const importOptions = markRaw<Record<string, importOption>>({});

  function addImportOption(uuid: string, option: importOption) {
    importOptions[uuid] = option;
  }

  function consumeImportOptions(uuid: string) {
    const options = importOptions[uuid];
    if (options) {
      const deepClonedOptions = structuredClone(options);
      delete importOptions[uuid];
      return deepClonedOptions;
    }
  }

  function isThereImportOptions() {
    return !!Object.keys(importOptions).length;
  }
  /**
   * Returns the index of the overlay layer with the given uuid within the
   * `layers` array, or undefined if no overlay layer matches.
   *
   * Note: the background layer is stored separately (in `backgroundLayer`),
   * so it is intentionally not found here. Use `getLayer` when the
   * background layer is also a valid target.
   *
   * @param uuid the layer's uuid
   * @returns the index, or undefined if not found (an error is logged)
   */
  function _getIndexFromIdentifier(uuid: string): number | undefined {
    const index = layers.value.findIndex((layer) => layer.uuid === uuid);

    if (index < 0) {
      if (uuid === backgroundLayer.value?.uuid) {
        // background layer errors are a false positive, so we don't log them
        return;
      }
      log.error(`Incorrect uuid given : ${uuid}`);
      return;
    }
    return index;
  }

  /**
   * Resolves a layer by its uuid, searching both the overlay layers and the
   * background layer (which is stored separately, not in the `layers` array).
   *
   * @param uuid the layer's uuid
   * @returns the matching layer, or undefined if no layer has this uuid
   *          (an error is logged only in that case)
   */
  function getLayer(uuid: string): Layer | undefined {
    const layer =
      layers.value.find((candidate) => candidate.uuid === uuid) ??
      (backgroundLayer.value?.uuid === uuid
        ? backgroundLayer.value
        : undefined);

    if (!layer) {
      log.error(`Incorrect uuid given : ${uuid}`);
      return;
    }
    return layer;
  }
  function setBackground(layer: Layer | null) {
    backgroundLayer.value = layer;
  }

  function addLayer(layer: Layer) {
    layers.value.push(layer);
  }

  function replaceLayer(uuid: string, replacement: Layer) {
    const index = _getIndexFromIdentifier(uuid);
    if ((index || index === 0) && layers.value[index]) {
      layers.value.splice(_getIndexFromIdentifier(uuid)!, 1, replacement);
    }
  }

  function setDimension(
    id: DimensionId,
    uuid: string,
    dimension: Partial<Dimension>,
  ) {
    const layer = getLayer(uuid);

    if (layer) {
      if (!layer.dimensions) {
        layer.dimensions = {};
      }

      log.debug({
        title: "layer Store",
        titleColor: LogPreDefinedColor.Cyan,
        messages: [
          `Updating ${layer.humanId} with dimension ${JSON.stringify(dimension)}`,
        ],
      });

      const existingDimension = layer.dimensions[id];

      layer.dimensions[id] = {
        availableValues: existingDimension?.availableValues ?? [],
        currentValue: existingDimension?.currentValue ?? null,
        ...dimension,
      };
    }
  }

  function setLayerInfo(uuid: string, info: LayerInfo): void {
    log.debug(
      `Setting layer info for layer ${uuid} to ${JSON.stringify(info)}`,
    );

    const layer = getLayer(uuid);
    if (layer) {
      layer.info = info;
    }
  }

  function removeLayer(uuid: string) {
    const index = _getIndexFromIdentifier(uuid);
    if ((index || index === 0) && layers.value[index]) {
      layers.value.splice(index, 1);
    }
  }

  function setLayerData(uuid: string, dataset: Dataset) {
    const layer = getLayer(uuid);
    if (layer) {
      layer.data = dataset;
    }
  }

  function $reset() {
    layers.value = [];
  }

  return {
    layers,
    backgroundLayer,
    // getters
    getLayer,
    isThereImportOptions,
    // actions
    addLayer,
    setBackground,
    replaceLayer,
    setLayerInfo,
    setDimension,
    removeLayer,
    setLayerData,
    addImportOption,
    consumeImportOptions,
    $reset,
  };
});
