import { createPinia, setActivePinia } from "pinia";

import usePositionStore from "@/stores/position";

const pinia = createPinia();
setActivePinia(pinia);

export const positionStore = usePositionStore();
