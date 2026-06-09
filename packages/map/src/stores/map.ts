import type { Map as OlMapType } from "ol";
import type { StoreDefinition } from "pinia";
import type { Ref, ShallowRef } from "vue";

import { defineStore } from "pinia";
import { ref, shallowRef } from "vue";

export const useMapStore: StoreDefinition<
  "map",
  Pick<
    {
      olMap: ShallowRef<OlMapType, OlMapType>;
      setOlMap: (map: OlMapType) => void;
      setIsMapLoaded: () => void;
      isMapLoaded: Ref<boolean, boolean>;
    },
    "olMap" | "isMapLoaded"
  >,
  Pick<
    {
      olMap: ShallowRef<OlMapType, OlMapType>;
      setOlMap: (map: OlMapType) => void;
      setIsMapLoaded: () => void;
      isMapLoaded: Ref<boolean, boolean>;
    },
    never
  >,
  Pick<
    {
      olMap: ShallowRef<OlMapType, OlMapType>;
      setOlMap: (map: OlMapType) => void;
      setIsMapLoaded: () => void;
      isMapLoaded: Ref<boolean, boolean>;
    },
    "setOlMap" | "setIsMapLoaded"
  >
> = defineStore("map", () => {
  const olMap = shallowRef<OlMapType | null>(null);
  const isMapLoaded = ref(false);

  function setOlMap(map: OlMapType) {
    olMap.value = map;
  }

  function setIsMapLoaded() {
    isMapLoaded.value = true;
  }

  return {
    olMap,
    setOlMap,
    setIsMapLoaded,
    isMapLoaded,
  };
});
