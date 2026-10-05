//

import type {
  DrawingsCreateResponse,
  DrawingsUpdateResponse,
} from "@swissgeo/drawing-sharing";

import { useDrawing } from "@swissgeo/drawing";
import { ref } from "vue";

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
    const drawingBlob = await serializeAllFeaturesAsBlob("kmz");

    if (!drawingBlob) {
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

    // If the drawing Id is already available, it is included
    if (drawingAdminId.value && drawingId.value) {
      await updateDrawing(formData);
    } else {
      await createDrawing(formData);
    }
  }

  async function createDrawing(formData: FormData) {
    const drawingServiceEndpoint = runtimeConfig.public
      .drawingServiceEndpoint as string;

    isSharing.value = true;

    const response = await fetch(drawingServiceEndpoint, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      isSharing.value = false;
      throw new Error(`Failed to share drawings: ${response.statusText}`);
    }

    const responseData = (await response.json()) as DrawingsCreateResponse;

    drawingId.value = responseData.id;
    drawingAdminId.value = responseData.admin_id;
    drawingS3Url.value = responseData.s3_url;
    isSharing.value = false;
  }

  async function updateDrawing(formData: FormData) {
    const drawingServiceEndpoint = runtimeConfig.public
      .drawingServiceEndpoint as string;

    isSharing.value = true;

    const response = await fetch(
      `${drawingServiceEndpoint}/${drawingId.value.toString()}`,
      {
        method: "PUT",
        body: formData,
        headers: new Headers({
          Authorization: `Bearer ${drawingAdminId.value.toString()}`,
        }),
      },
    );

    if (!response.ok) {
      isSharing.value = false;
      throw new Error(`Failed to update drawing: ${response.statusText}`);
    }

    const responseData = (await response.json()) as DrawingsUpdateResponse;

    drawingId.value = responseData.id;
    drawingAdminId.value = responseData.admin_id;
    drawingS3Url.value = responseData.s3_url;
    isSharing.value = false;
  }

  return {
    isSharing,
    shareDrawings,
  };
}
