import { storeToRefs } from "pinia";

import { usePrintRequestsStore } from "../stores/printRequest";

/**
 * Interval in milliseconds to poll the print service for the status of open print jobs.
 * This is a trade-off between responsiveness and server load.
 */
const PRINT_STATUS_POLL_INTERVAL_MS = 2000;

/**
 * Composable that provides a collection of print requests and their status, and allows to send new print requests to the print service.
 * It also provides a method to refresh the status of the print jobs that are still open.
 * It makes use of the print request store to centralize the data and ensure all instances of this composable share the same data,
 * and is the prefered interface to interact with the print service.
 */
export function usePrintRequests() {
  const runtimeConfig = useRuntimeConfig();
  const printUrl = runtimeConfig.public.printServiceUrl;
  const { requestCollection, isPollingGlobal } = storeToRefs(
    usePrintRequestsStore(),
  );
  const { clearRequestCollection } = usePrintRequestsStore();

  /**
   * Start polling the print service for the status of open print jobs, if not already started.
   * (the startus of whether this has started or not is held in the store so mounting this
   * composable multiple times will not start multiple polling intervals)
   */
  function startPolling() {
    if (isPollingGlobal.value) {
      return;
    }

    isPollingGlobal.value = true;

    setInterval(() => {
      void refreshOpenRequests();
    }, PRINT_STATUS_POLL_INTERVAL_MS);
  }

  // The polling only happens client-side
  if (import.meta.client) {
    startPolling();
  }

  /**
   * Exposes the request collection sorted from newer to older, based on the creation date of the print job.
   * This is useful for displaying the most recent print jobs first in the UI.
   */
  const requestCollectionNewerToOlder = computed(() => {
    return [...requestCollection.value].sort((a, b) => {
      const dateA = new Date(a.lastResponse.created);
      const dateB = new Date(b.lastResponse.created);
      return dateB.getTime() - dateA.getTime();
    });
  });

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
   * Refresh the status of the print jobs that were left "open" or "started" (pdf is not ready yet)
   * by polling the print service for their status.
   * Note: not exposed to the outside, as the polling is done automatically in the background only from this composable.
   */
  async function refreshOpenRequests() {
    const openRequests = requestCollection.value.filter(
      (request: PrintRequestCollectionItem) =>
        (request.lastResponse.status === "open" ||
          request.lastResponse.status === "started") &&
        typeof request.lastResponse.reportUrl === "string" &&
        request.isPolling === false,
    );

    // A "task" of polling a print job happens only if such print job is not currently being polled
    // from a previous polling round (due to interval calls)
    const tasks = openRequests.map(
      async (request: PrintRequestCollectionItem) => {
        const reportUrl = request.lastResponse.reportUrl;
        if (!reportUrl) {
          return;
        }

        request.isPolling = true;
        try {
          request.lastResponse = await $fetch(reportUrl);
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

      // Adding a new element in the requestCollection, which contains both the payload
      // of the request (POST body) and the response from the print service (status of the print job)
      requestCollection.value.push({
        requestBody: printPostRequestBody,
        lastResponse: data,
        isPolling: false,
      });

      // Note: here no need to call startPolling(), as this was already done when the composable was mounted,
      // and the polling is done in the background automatically.
    } catch (_err) {
      // nothing to do, the request failed and the user will see an error message in the UI
    }
  }

  return {
    sendCustomPrintRequest,
    requestCollection,
    ongoingRequests,
    finishedRequests,
    errorRequests,
    requestCollectionNewerToOlder,
    clearRequestCollection,
  };
}
