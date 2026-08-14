import type { Layer } from "@swissgeo/layers";
import type { Dataset } from "@swissgeo/ogc";
import type { Ref } from "vue";

import { makeServerLayer } from "@swissgeo/layers";
import { computedAsync } from "@vueuse/core";
import { AVAILABLE_BACKGROUNDS } from "~/components/map/constants";
import { computed, watch } from "vue";

export function getBackgroundLayerTranslationKey(
  backgroundLayer?: Layer | null,
): string {
  if (!backgroundLayer?.data || typeof backgroundLayer.data === "string") {
    return "backgroundLayers.voidMap";
  }

  switch (backgroundLayer.data.id) {
    case AVAILABLE_BACKGROUNDS[0]:
      return "backgroundLayers.greyMap";
    case AVAILABLE_BACKGROUNDS[1]:
      return "backgroundLayers.colorMap";
    case AVAILABLE_BACKGROUNDS[2]:
      return "backgroundLayers.swissimage";
    default:
      return "backgroundLayers.voidMap";
  }
}

export function useBackgroundLayers(
  currentBackground: Ref<Layer | null | undefined>,
  enabled: Ref<boolean>,
  selectBackground: (backgroundLayer: Layer | null) => void,
) {
  const { locale } = useI18n();
  const catalogItemsUrl = useCatalogItemsUrl();

  const backgroundRecords = computed(async () => {
    if (!enabled.value) {
      return [];
    }

    const records = await Promise.all(
      AVAILABLE_BACKGROUNDS.map((backgroundId) => {
        const url = new URL(catalogItemsUrl(backgroundId));
        url.searchParams.set("lang", locale.value);
        return $fetch<Dataset>(url.toString());
      }),
    );

    return records.map((record) => makeServerLayer(record));
  });

  const backgroundLayers = computedAsync<(Layer | null)[]>(async () => {
    if (!enabled.value) {
      return [];
    }
    return [null, ...(await backgroundRecords.value)];
  }, []);

  watch(backgroundLayers, (backgrounds) => {
    if (!enabled.value || currentBackground.value !== undefined) {
      return;
    }

    const defaultBackground = backgrounds.find((background) => {
      return (
        background?.data &&
        typeof background.data === "object" &&
        background.data.id === AVAILABLE_BACKGROUNDS[1]
      );
    });
    const fallbackBackground = backgrounds.find(
      (background): background is Layer => background !== null,
    );

    selectBackground(defaultBackground ?? fallbackBackground ?? null);
  });

  return { backgroundLayers };
}
