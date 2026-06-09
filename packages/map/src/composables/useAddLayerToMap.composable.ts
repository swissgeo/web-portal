import type { Map } from "ol";
// import LayerGroup from 'ol/layer/Group'
import type BaseLayer from "ol/layer/Base";
import type { Ref } from "vue";

import log, { LogPreDefinedColor } from "@swissgeo/log";
import LayerGroup from "ol/layer/Group";
import Layer from "ol/layer/Layer";
import VectorSource from "ol/source/Vector";
import { onBeforeUnmount, shallowRef, toRaw, watchEffect } from "vue";

/**
 * Vue composable that will handle the addition or removal of an OpenLayers layer. This is a
 * centralized way of describing this logic.
 *
 * The composable will manage the layer and will remove it from the map as soon as the component
 * that has used this composable is removed from the DOM.
 *
 * This layer should be one of OpenLayers JS API layer type, i.e. `/ol/layer/Vector`,
 * `/ol/layer/Tile`, etc...
 *
 */
export default function useAddLayerToMap(
  olLayer: Ref<BaseLayer | undefined>,
  zIndex: Ref<number>,
  isVisible: Ref<boolean>,
  opacity: Ref<number>,
  olMap: Ref<Map | undefined> | undefined,
): {
  addLayerToMap: () => void;
  removeLayerFromMap: () => void;
  setVisibility: (isVisible: boolean) => void;
  setZIndex: (zIndex: number) => void;
  setOpacity: (opacity: number) => void;
} {
  const layerOnMap = shallowRef<BaseLayer>();

  onBeforeUnmount(() => {
    clearSources(layerOnMap.value ?? olLayer.value);
    removeLayerFromMap();
  });

  function clearSources(layer: BaseLayer | undefined) {
    const rawLayer = layer ? toRaw(layer) : undefined;
    if (rawLayer instanceof Layer) {
      // if the source of this layer can be cleared (if it's a vector layer),
      // we clear it before removing it from the map, ensuring that all features are unloaded
      const source = rawLayer.getSource();
      if (source instanceof VectorSource) {
        source.clear();
      }

      rawLayer.setSource(null);
    }
  }

  function clearLayerGroup(layer: BaseLayer) {
    if (layer instanceof LayerGroup) {
      layer.getLayers().clear();
    }
  }

  function addLayerToMap(): void {
    if (!olMap || !olMap.value || !olLayer.value) {
      return;
    }
    const rawLayer = toRaw(olLayer.value);

    if (layerOnMap.value === rawLayer) {
      setZIndex(zIndex.value);
      return;
    }

    if (layerOnMap.value) {
      olMap.value.removeLayer(layerOnMap.value);
      clearLayerGroup(layerOnMap.value);
    }

    log.debug({
      title: "useAddLayerToMap",
      titleColor: LogPreDefinedColor.Amber,
      messages: [
        // @ts-expect-error This ol layer should have the prop
        `Going to add layer ${rawLayer.ol_uid} to map ${olMap.value.ol_uid} with zIndex ${zIndex.value}`,
        rawLayer,
        olMap.value,
      ],
    });
    olMap.value.addLayer(rawLayer);
    layerOnMap.value = rawLayer;
    setZIndex(zIndex.value);
  }

  function removeLayerFromMap(): void {
    if (!olMap || !olMap.value) {
      return;
    }

    const rawLayer = toRaw(layerOnMap.value ?? olLayer.value);
    if (!rawLayer) {
      return;
    }

    log.debug({
      title: "useAddLayerToMap",
      titleColor: LogPreDefinedColor.Amber,
      // @ts-expect-error This ol layer should have the prop
      messages: ["Removing layer with ID from map:", olLayer.value.ol_uid],
    });

    const removed = olMap.value.removeLayer(rawLayer);
    if (removed === undefined) {
      log.error({
        title: "useAddLayerToMap",
        titleColor: LogPreDefinedColor.Red,
        messages: ["ERROR: unable to remove the layer from the map"],
      });
    }

    clearLayerGroup(rawLayer);
  }

  function setVisibility(isVisible: boolean) {
    if (olLayer.value) {
      olLayer.value.setVisible(isVisible);
    }
  }

  function setZIndex(zIndex: number) {
    if (olLayer.value) {
      olLayer.value.setZIndex(zIndex);
    }
  }

  function setOpacity(opacity: number) {
    if (olLayer.value) {
      olLayer.value.setOpacity(opacity);
    }
  }

  watchEffect(() => {
    setZIndex(zIndex.value);
  });

  watchEffect(() => {
    setVisibility(isVisible.value);
  });

  watchEffect(() => {
    setOpacity(opacity.value);
  });

  return {
    addLayerToMap,
    removeLayerFromMap,
    setVisibility,
    setZIndex,
    setOpacity,
  };
}
