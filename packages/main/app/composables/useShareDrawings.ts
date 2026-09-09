//

import { useDrawing } from "@swissgeo/drawing";
import { ref } from "vue";

export function useShareDrawings() {
  const runtimeConfig = useRuntimeConfig();
  const { serializeAllFeaturesAsBlob } = useDrawing();
  const isSharing = ref(false);

  async function shareDrawings() {
    isSharing.value = true;
    const drawingServiceEndpoint = runtimeConfig.public.drawingServiceEndpoint;
    const drawingBlob = await serializeAllFeaturesAsBlob("kmz");

    if (!drawingBlob) {
      isSharing.value = false;
      return;
    }

    const drawingFile = new File([drawingBlob], "drawing.kmz", {
      type: drawingBlob.type,
    });
    const digest = await crypto.subtle.digest(
      "SHA-256",
      await drawingFile.arrayBuffer(),
    );
    const sha256 = Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");

    const formData = new FormData();
    formData.append("file", drawingFile);
    formData.append("sha256", sha256);

    const response = await fetch(drawingServiceEndpoint, {
      method: "POST",
      body: formData,
    });
    console.log("Response from sharing drawings:", response);

    isSharing.value = false;
  }

  return {
    isSharing,
    shareDrawings,
  };
}
