import { useDimensionsStore } from "@swissgeo/dimension";
import { useFeaturesStore } from "@swissgeo/feature";
import { useLayerStore } from "@swissgeo/layers";
import { usePositionStore } from "@swissgeo/map";

export function useResetApp() {
  // we only want this on the client side
  if (import.meta.client) {
    const { clear: clearSessionStorage } = useRestoreState();

    const layerStore = useLayerStore();
    const positionStore = usePositionStore();
    const dimensionsStore = useDimensionsStore();
    const featureStore = useFeaturesStore();

    function resetApp() {
      clearSessionStorage();
      layerStore.$reset();
      positionStore.$reset();
      dimensionsStore.$reset();
      featureStore.$reset();
    }

    return { resetApp };
  } else {
    // returning a stupid placeholder for SSR
    function resetApp() {}
    return {
      resetApp,
    };
  }
}
