import type {
  SemanticLayerInput,
  SemanticProgressResponse,
  SemanticRankRequest,
  SemanticReadyResponse,
  SemanticResultResponse,
  SemanticWorkerRequest,
} from "./naturalLanguageMapSearchProtocol";

import { isSemanticWorkerResponse } from "./naturalLanguageMapSearchProtocol";

interface PendingRequest {
  onProgress?: (progress: SemanticProgressResponse) => void;
  reject: (reason: Error) => void;
  resolve: (response: SemanticReadyResponse | SemanticResultResponse) => void;
}

let nextRequestId = 1;
let modelLoadPromise: Promise<void> | undefined;
let modelReady = false;
let semanticWorker: Worker | undefined;
const pendingRequests = new Map<number, PendingRequest>();

function rejectPendingRequests(error: Error): void {
  pendingRequests.forEach(({ reject }) => reject(error));
  pendingRequests.clear();
}

function handleWorkerMessage(event: MessageEvent<unknown>): void {
  if (!isSemanticWorkerResponse(event.data)) {
    return;
  }

  const pending = pendingRequests.get(event.data.requestId);
  if (!pending) {
    return;
  }

  if (event.data.type === "progress") {
    pending.onProgress?.(event.data);
    return;
  }

  pendingRequests.delete(event.data.requestId);
  if (event.data.type === "error") {
    pending.reject(new Error(event.data.message));
    return;
  }
  pending.resolve(event.data);
}

function handleWorkerError(event: ErrorEvent): void {
  const message = event.message || "Semantic search worker failed";
  rejectPendingRequests(new Error(message));
  semanticWorker?.terminate();
  semanticWorker = undefined;
  modelLoadPromise = undefined;
  modelReady = false;
}

function getSemanticWorker(): Worker {
  if (!semanticWorker) {
    semanticWorker = new Worker(
      new URL("../workers/naturalLanguageMapSearch.worker.ts", import.meta.url),
      { type: "module" },
    );
    semanticWorker.addEventListener("message", handleWorkerMessage);
    semanticWorker.addEventListener("error", handleWorkerError);
  }
  return semanticWorker;
}

function sendRequest(
  request: SemanticWorkerRequest,
  onProgress?: (progress: SemanticProgressResponse) => void,
): Promise<SemanticReadyResponse | SemanticResultResponse> {
  return new Promise((resolve, reject) => {
    pendingRequests.set(request.requestId, { onProgress, reject, resolve });
    try {
      getSemanticWorker().postMessage(request);
    } catch (error) {
      pendingRequests.delete(request.requestId);
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}

export function preloadModelWithWorker(): Promise<void> {
  if (!modelLoadPromise) {
    const requestId = nextRequestId;
    nextRequestId += 1;
    modelLoadPromise = sendRequest({ requestId, type: "load" })
      .then((response) => {
        if (response.type !== "ready") {
          throw new Error(
            "Semantic search worker returned an invalid response",
          );
        }
        modelReady = true;
      })
      .catch((error: unknown) => {
        modelLoadPromise = undefined;
        modelReady = false;
        throw error;
      });
  }
  return modelLoadPromise;
}

export function rankLayersWithWorker(
  query: string,
  candidates: SemanticLayerInput[],
  onProgress?: (progress: SemanticProgressResponse) => void,
): Promise<SemanticResultResponse> {
  if (!modelReady) {
    return Promise.reject(
      new Error("Load the semantic model before searching"),
    );
  }

  const requestId = nextRequestId;
  nextRequestId += 1;

  const request: SemanticRankRequest = {
    candidates,
    query,
    requestId,
    type: "rank",
  };

  return sendRequest(request, onProgress).then((response) => {
    if (response.type !== "result") {
      throw new Error("Semantic search worker returned an invalid response");
    }
    return response;
  });
}
