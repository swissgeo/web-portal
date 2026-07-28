import { useDimensionsStore } from "@swissgeo/dimension";
import { useDrawing } from "@swissgeo/drawing";
import { useLayerStore } from "@swissgeo/layers";
import { useGeolocationStore } from "~/stores/geolocation";
import { useMapViewStore } from "~/stores/mapView";
import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";

export const useToolboxStore = defineStore("toolbox", () => {
  const { focusMode } = useDrawing();
  const layerStore = useLayerStore();
  const dimensionsStore = useDimensionsStore();
  const mapViewStore = useMapViewStore();
  const geolocationStore = useGeolocationStore();

  const showFullScreeButton = ref(true);
  const showGelocationButton = ref(true);
  const showCompassButton = ref(false);
  const showZoomButtons = ref(true);
  const show3dButton = ref(false);
  const showDrawButton = ref(true);
  const showMeasureButton = ref(true);
  const showImportButton = ref(true);
  const showShareButton = ref(true);
  const showPrintButton = ref(true);

  const showRecenterButton = computed(
    () => geolocationStore.active && geolocationStore.position !== undefined,
  );
  const showTimeSliderButton = computed(() =>
    layerStore.layers.some(
      (layer) => !!dimensionsStore.getDimensions(layer.uuid)?.time,
    ),
  );
  const showCompareSliderButton = computed(
    () => mapViewStore.visibleLayers.length > 0,
  );
  const focusModeNone = computed(() => focusMode.value === "none");

  watch(showTimeSliderButton, (hasTimeLayers) => {
    if (!hasTimeLayers) {
      mapViewStore.closeTimeSlider();
    }
  });

  return {
    showFullScreeButton,
    showGelocationButton,
    showCompassButton,
    showZoomButtons,
    show3dButton,
    showDrawButton,
    showMeasureButton,
    showImportButton,
    showShareButton,
    showPrintButton,
    showRecenterButton,
    showTimeSliderButton,
    showCompareSliderButton,
    focusModeNone,
  };
});
