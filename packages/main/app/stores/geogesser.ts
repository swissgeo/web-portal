import { defineStore } from "pinia";
import { ref } from "vue";

/**
 * Geogesser game state that the search field and the map share. The search
 * field opens the game, the map shows it and takes the guesses.
 */
export const useGeogesserStore = defineStore("geogesser", () => {
  const isOpen = ref(false);

  function open() {
    isOpen.value = true;
  }

  function close() {
    isOpen.value = false;
  }

  return { isOpen, open, close };
});
