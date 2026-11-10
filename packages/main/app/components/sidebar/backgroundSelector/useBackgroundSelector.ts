import type { Layer } from "@swissgeo/layers";

import colorMapUrl from "~/assets/backgroundLayersImages/colorMap.png";
import greyMapUrl from "~/assets/backgroundLayersImages/greyMap.png";
import swissimageUrl from "~/assets/backgroundLayersImages/swissimage.png";
import voidUrl from "~/assets/backgroundLayersImages/void.png";
import { ref } from "vue";

import { AVAILABLE_BACKGROUNDS } from "@/components/sidebar/backgroundSelector/constants";

export default function useBackgroundSelector(
  selectBackgroundCallback: (backgroundLayer: Layer | null) => void,
) {
  const selectorOpen = ref<boolean>(false);

  function getImageForBackgroundLayer(backgroundLayer?: Layer | null): string {
    if (!backgroundLayer) {
      return voidUrl;
    }

    if (!backgroundLayer.data || typeof backgroundLayer.data === "string") {
      throw new Error("something wrong with the background layer");
    }

    const layerData = backgroundLayer.data;

    const backgroundId = "id" in layerData ? layerData.id : undefined;
    switch (backgroundId) {
      case AVAILABLE_BACKGROUNDS.colorMap:
        return colorMapUrl;
      case AVAILABLE_BACKGROUNDS.greyMap:
        return greyMapUrl;
      case AVAILABLE_BACKGROUNDS.swissimage:
        return swissimageUrl;
    }

    return voidUrl;
  }

  function onSelectBackground(backgroundLayer: Layer | null) {
    selectBackgroundCallback(backgroundLayer);
    selectorOpen.value = false;
  }

  function toggleShowSelector() {
    selectorOpen.value = !selectorOpen.value;
  }

  return {
    selectorOpen,
    getImageForBackgroundLayer,
    onSelectBackground,
    toggleShowSelector,
  };
}
