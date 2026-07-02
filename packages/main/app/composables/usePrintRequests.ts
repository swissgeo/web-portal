import { defineStore, storeToRefs } from "pinia";

import type { PrintFormat, PrintOrientation } from "../types/print";

/**
 * Body of the POST request sent to the print service to trigger a print job.
 */
export type PrintPostRequestBody = {
  state_id: string;
  print_format: PrintFormat;
  print_orientation: PrintOrientation;
  print_resolution: number;
  print_legend: boolean;
  print_grid: boolean;
  print_lang: string;
};

export type PrintJobStatusResponse = {
  /**
   * A print job can be "open" when it's being processed, "finished" when the PDF is ready or "error" if something went wrong during the processing
   */
  status: "open" | "started" | "finished" | "error";
  /**
   * ISO string of the date when the print job was created, but not started yet
   */
  created: string;
  /**
   * ISO string of the date when the print job started to be processed
   */
  started: string;
  /**
   * ISO string of the date when the print job finished (either with success or error depending on the status)
   */
  finished: string;
  /**
   * URL to the detailed report of the print job, if available. This endpoint is specific to a print job and must be used to obtain status updates.
   */
  reportPath: string | null;
  /**
   * Optional message providing additional information about the print job status
   */
  message?: string | null;
  /**
   * URL to the generated PDF file, if available
   */
  pdfPath?: string;
};

type PrintRequestCollectionItem = {
  requestBody: PrintPostRequestBody;
  lastResponse: PrintJobStatusResponse;
  isPolling: boolean;
};

const PRINT_REQUESTS_STORAGE_KEY = "printRequestsCollection";
const PRINT_STATUS_POLL_INTERVAL_MS = 5000;

/**
 * Pinia store that centralizes the print request collection and its localStorage persistence.
 * Using a store ensures all instances of usePrintRequests() share the same data.
 */
const usePrintRequestsStore = defineStore("printRequests", () => {
  const requestCollection = ref<PrintRequestCollectionItem[]>([]);

  if (import.meta.client) {
    // Hydrate from localStorage on first load
    const serialized = localStorage.getItem(PRINT_REQUESTS_STORAGE_KEY);
    if (serialized) {
      try {
        const parsed = JSON.parse(serialized);
        if (Array.isArray(parsed)) {
          requestCollection.value = parsed;
        }
      } catch {
        // Ignore invalid persisted content and keep empty state.
      }
    }

    // Persist every change back to localStorage
    watch(
      requestCollection,
      (newCollection) => {
        localStorage.setItem(
          PRINT_REQUESTS_STORAGE_KEY,
          JSON.stringify(newCollection),
        );
      },
      { deep: true },
    );
  }

  return { requestCollection };
});

export function usePrintRequests() {
  const runtimeConfig = useRuntimeConfig();
  const printUrl = runtimeConfig.public.printServiceUrl;
  const { requestCollection } = storeToRefs(usePrintRequestsStore());

  if (import.meta.client) {
    /**
     * Regularly poll the print service for the status of the print jobs that are still open,
     * to update their status in the UI when they are finished.
     */
    const pollingTimer = setInterval(() => {
      void refreshOpenRequests();
    }, PRINT_STATUS_POLL_INTERVAL_MS);

    // Remove the polling timer when the component is unmounted
    onBeforeUnmount(() => {
      clearInterval(pollingTimer);
    });
  }

  /**
   * A collection of print requests that are still open (pdf is not ready yet)
   * That includes the request that have both statuses "open" and "started"
   */
  const ongoingRequests = computed(() => {
    return requestCollection.value.filter(
      (request: PrintRequestCollectionItem) =>
        request.lastResponse.status === "open" ||
        request.lastResponse.status === "started",
    );
  });

  /**
   * A collection of print requests that finished with success (pdf is ready)
   */
  const finishedRequests = computed(() => {
    return requestCollection.value.filter(
      (request: PrintRequestCollectionItem) =>
        request.lastResponse.status === "finished",
    );
  });

  /**
   * A collection of print requests that finished with error (pdf generation failed)
   */
  const errorRequests = computed(() => {
    return requestCollection.value.filter(
      (request: PrintRequestCollectionItem) =>
        request.lastResponse.status === "error",
    );
  });

  /**
   * Refresh the status of the print jobs that were left open
   */
  async function refreshOpenRequests() {
    const openRequests = requestCollection.value.filter(
      (request: PrintRequestCollectionItem) =>
        request.lastResponse.status === "open" &&
        typeof request.lastResponse.reportPath === "string" &&
        request.isPolling === false,
    );

    const tasks = openRequests.map(
      async (request: PrintRequestCollectionItem) => {
        const reportPath = request.lastResponse.reportPath;
        if (!reportPath) {
          return;
        }

        request.isPolling = true;
        try {
          request.lastResponse = await $fetch(reportPath);
        } catch {
          // ignore temporary polling error
        } finally {
          request.isPolling = false;
        }
      },
    );

    await Promise.allSettled(tasks);
  }

  /**
   * Send a new print request to the pint service.
   * This will update the collections of requests.
   */
  async function sendCustomPrintRequest(
    printPostRequestBody: PrintPostRequestBody,
  ) {
    try {
      const data = await $fetch<PrintJobStatusResponse>(printUrl, {
        method: "POST",
        body: printPostRequestBody,
      });

      requestCollection.value.push({
        requestBody: printPostRequestBody,
        lastResponse: data,
        isPolling: false,
      });
    } catch (_err) {
      // nothing to do, the request failed and the user will see an error message in the UI
    }
  }

  return {
    sendCustomPrintRequest,
    refreshOpenRequests,
    requestCollection,
    ongoingRequests,
    finishedRequests,
    errorRequests,
  };
}
