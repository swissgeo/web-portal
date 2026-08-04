import type { Dataset, Legend } from "@swissgeo/ogc";

import log, { LogPreDefinedColor } from "@swissgeo/log";
import { defineStore } from "pinia";
import { ref, markRaw } from "vue";

import type { Layer, LayerInfo } from "@/index";

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

  /**
   * The active background layer, or null if none is selected. Initialising to undefined to
   * be able to distinguish the unitialized state from setting none
   */
  const backgroundLayer = ref<Layer | null | undefined>(undefined);

  const importOptions = markRaw<Record<string, importOption>>({});

  /**
   * Legends advertised by the services, per layer uuid. They are not part of the
   * layer itself because they come from the service capabilities, which are
   * re-fetched (and thus re-emitted) independently of the layer, notably on a
   * locale change.
   */
  const legends = ref<Record<string, Legend[]>>({});

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
    log.debug({
      title: "layer store",
      titleColor: LogPreDefinedColor.Cyan,
      messages: ["Changing background in the store to", layer],
    });
    backgroundLayer.value = layer;
  }

  function addLayer(layer: Layer) {
    layers.value.push(layer);
  }

  function replaceLayer(uuid: string, replacement: Layer) {
    const index = _getIndexFromIdentifier(uuid);
    if ((index || index === 0) && layers.value[index]) {
      layers.value.splice(index, 1, replacement);
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

  function setLayerLegends(uuid: string, layerLegends: Legend[]): void {
    legends.value[uuid] = layerLegends;
  }

  function getLayerLegends(uuid: string): Legend[] {
    return legends.value[uuid] ?? [];
  }

  function removeLayer(uuid: string) {
    delete legends.value[uuid];

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
    legends.value = {};
  }

  return {
    layers,
    backgroundLayer,
    // getters
    getLayer,
    getLayerLegends,
    isThereImportOptions,
    // actions
    addLayer,
    setBackground,
    replaceLayer,
    setLayerInfo,
    setLayerLegends,
    removeLayer,
    setLayerData,
    addImportOption,
    consumeImportOptions,
    $reset,
  };
});
