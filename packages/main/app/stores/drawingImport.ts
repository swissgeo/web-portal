import { defineStore } from "pinia";

export const useDrawingImportStore = defineStore("drawingImport", () => {
  // The drawing ID is a unique identifier for the current drawing session,
  // it is provided by the drawing service (backend), only after the first sharing.
  // The drawingId can be used to share with other users, and the drawingAdminId is used to
  // update the drawing on the backend (generaly not shared with other users)
  const drawingId = ref<string>("");
  const drawingAdminId = ref<string>("");

  function resetDrawingImportInfo() {
    drawingId.value = "";
    drawingAdminId.value = "";
  }

  return { drawingId, drawingAdminId, resetDrawingImportInfo };
});
