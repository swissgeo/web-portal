//

import { useDrawing } from "@swissgeo/drawing";
import { ref } from "vue";

type DrawingServiceResponse = {
  id: string;
  admin_id: string;
  s3_url: string;
};

export function useShareDrawings() {
  const runtimeConfig = useRuntimeConfig();
  const {
    serializeAllFeaturesAsBlob,
    drawingAdminId,
    drawingId,
    drawingS3Url,
  } = useDrawing();
  const isSharing = ref(false);

  async function shareDrawings() {
    isSharing.value = true;
    const drawingServiceEndpoint = runtimeConfig.public
      .drawingServiceEndpoint as string;
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

    let requestUrl = drawingServiceEndpoint;
    let method = "POST";

    // If the drawing Id is already available, it is included
    if (drawingAdminId.value && drawingId.value) {
      formData.append("admin_id", drawingAdminId.value);
      requestUrl = `${drawingServiceEndpoint}/${drawingId.value}`;
      method = "PUT";
    }

    const response = await fetch(requestUrl, {
      method: method,
      body: formData,
    });

    isSharing.value = false;

    if (!response.ok) {
      throw new Error(`Failed to share drawings: ${response.statusText}`);
    }

    const responseData = (await response.json()) as DrawingServiceResponse;

    drawingId.value = responseData.id;
    drawingAdminId.value = responseData.admin_id;
    drawingS3Url.value = responseData.s3_url;
  }

  return {
    isSharing,
    shareDrawings,
  };
}
