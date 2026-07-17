import type {
  SemanticLayerInput,
  SemanticProgressResponse,
  SemanticRankRequest,
  SemanticResultResponse,
} from "./naturalLanguageMapSearchProtocol";

import { isSemanticWorkerResponse } from "./naturalLanguageMapSearchProtocol";

interface PendingRequest {
  onProgress?: (progress: SemanticProgressResponse) => void;
  reject: (reason: Error) => void;
  resolve: (result: SemanticResultResponse) => void;
}

let nextRequestId = 1;
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

export function rankLayersWithWorker(
  query: string,
  candidates: SemanticLayerInput[],
  onProgress?: (progress: SemanticProgressResponse) => void,
): Promise<SemanticResultResponse> {
  const requestId = nextRequestId;
  nextRequestId += 1;

  const request: SemanticRankRequest = {
    candidates,
    query,
    requestId,
    type: "rank",
  };

  return new Promise((resolve, reject) => {
    pendingRequests.set(requestId, { onProgress, reject, resolve });
    try {
      getSemanticWorker().postMessage(request);
    } catch (error) {
      pendingRequests.delete(requestId);
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}
