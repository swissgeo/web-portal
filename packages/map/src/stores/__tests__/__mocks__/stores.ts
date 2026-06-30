import type { ActionDispatcher } from "@swissgeo/shared/action-dispatcher";

import { createPinia, setActivePinia } from "pinia";

import usePositionStore from "@/stores/position";

const pinia = createPinia();
setActivePinia(pinia);

export const positionStore = usePositionStore();

export const mockDispatcher: ActionDispatcher = {
  name: "mockDispatcher",
};
