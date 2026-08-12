import log from "@swissgeo/log";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

import type { IconSetApiDescription } from "../core/IconSet";

import { IconSet } from "../core/IconSet";

type IconServiceResponse = {
  items: IconSetApiDescription[];
};

/**
 * The "default" icon set is not the first from the list provided by the icon service,
 * so we provide a constant for it here to avoid using a less generic icon set as default.
 */
export const DEFAULT_ICON_SET_NAME = "default";

export const useIconsStore = defineStore("icons", () => {
  const iconSets = ref<IconSet[]>([]);
  const isLoading = ref(false);
  const isReady = ref(false);
  const defaultIconName = computed(() => {
    const defaultIconSet = getDefaultIconSet();
    if (defaultIconSet && defaultIconSet.icons.length > 0) {
      return defaultIconSet.icons[0].name;
    }
    return "";
  });

  async function loadIconSets(iconSetUrl: string): Promise<void> {
    isLoading.value = true;
    const tmpIconSet: IconSet[] = [];
    try {
      const response = await fetch(iconSetUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch icon set: ${response.statusText}`);
      }
      const data: IconServiceResponse = await response.json();
      for (const iconSetItem of data.items) {
        const newIconSet = new IconSet(iconSetItem);
        await newIconSet.loadIcons(); // Load icons for the new icon set
        tmpIconSet.push(newIconSet);
      }
    } catch (_err) {
      log.error("Error loading icon set");
    }
    iconSets.value = tmpIconSet;
    isLoading.value = false;
    isReady.value = true;
  }

  function getIconSetByName(name: string): IconSet | undefined {
    return (
      iconSets.value.find((iconSet) => iconSet.name === name) ??
      getDefaultIconSet()
    );
  }

  function getDefaultIconSet(): IconSet | undefined {
    return iconSets.value.find(
      (iconSet) => iconSet.name === DEFAULT_ICON_SET_NAME,
    );
  }

  return {
    isLoading,
    iconSets,
    loadIconSets,
    isReady,
    getIconSetByName,
    getDefaultIconSet,
    defaultIconName,
  };
});
