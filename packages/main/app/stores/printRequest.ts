import { defineStore } from "pinia";

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
  reportUrl: string | null;
  /**
   * Optional message providing additional information about the print job status
   */
  message?: string | null;
  /**
   * URL to the generated PDF file, if available
   */
  pdfUrl?: string;
};

/**
 * A print request collection is a piece of data that is kept and traces the history of the print jobs that were sent to the print service.
 * Each element of the collection contains both the payload of the request (POST body) and the response from the print service (status of the print job).
 * The collection is persisted in localStorage so that it survives page reloads.
 * Keeping the POST request body allows performing a new request with the same parameters if the user wants to reprint a previous print job that is no longer available on the backend (feature not implemented yet).
 */
export type PrintRequestCollectionItem = {
  requestBody: PrintPostRequestBody;
  lastResponse: PrintJobStatusResponse;
  isPolling: boolean;
};

/**
 * Key used to persist the print request collection in localStorage
 */
const PRINT_REQUESTS_STORAGE_KEY = "printRequestsCollection";

/**
 * Pinia store that centralizes the print request collection and its localStorage persistence.
 * Using a store ensures all instances of usePrintRequests() share the same data.
 */
export const usePrintRequestsStore = defineStore("printRequests", () => {
  const requestCollection = ref<PrintRequestCollectionItem[]>([]);
  const isPollingGlobal = ref(false);

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

  /**
   * Remove all the elements from the print collection and clear the localStorage entry.
   */
  function clearRequestCollection() {
    requestCollection.value = [];
    localStorage.removeItem(PRINT_REQUESTS_STORAGE_KEY);
  }

  return { requestCollection, isPollingGlobal, clearRequestCollection };
});
