export interface SemanticLayerInput {
  id: string;
  text: string;
}

export interface SemanticLayerScore {
  id: string;
  score: number;
}

export interface SemanticWorkerTimings {
  embeddingMs: number;
  modelMs: number;
  rankingMs: number;
  totalMs: number;
}

export type SemanticWorkerStage = "loading-model" | "embedding" | "ranking";

export interface SemanticLoadRequest {
  requestId: number;
  type: "load";
}

export interface SemanticRankRequest {
  candidates: SemanticLayerInput[];
  query: string;
  requestId: number;
  type: "rank";
}

export type SemanticWorkerRequest = SemanticLoadRequest | SemanticRankRequest;

export interface SemanticProgressResponse {
  cachedCandidates: number;
  requestId: number;
  stage: SemanticWorkerStage;
  totalCandidates: number;
  type: "progress";
}

export interface SemanticResultResponse {
  cacheHits: number;
  embeddedCandidates: number;
  requestId: number;
  scores: SemanticLayerScore[];
  timings: SemanticWorkerTimings;
  type: "result";
}

export interface SemanticReadyResponse {
  requestId: number;
  type: "ready";
}

export interface SemanticErrorResponse {
  message: string;
  requestId: number;
  type: "error";
}

export type SemanticWorkerResponse =
  | SemanticProgressResponse
  | SemanticResultResponse
  | SemanticReadyResponse
  | SemanticErrorResponse;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function isSemanticLayerInput(value: unknown): value is SemanticLayerInput {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.text === "string"
  );
}

function isSemanticLayerScore(value: unknown): value is SemanticLayerScore {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.score === "number"
  );
}

function isSemanticWorkerTimings(
  value: unknown,
): value is SemanticWorkerTimings {
  return (
    isRecord(value) &&
    typeof value.embeddingMs === "number" &&
    typeof value.modelMs === "number" &&
    typeof value.rankingMs === "number" &&
    typeof value.totalMs === "number"
  );
}

function isSemanticWorkerStage(value: unknown): value is SemanticWorkerStage {
  return (
    value === "loading-model" || value === "embedding" || value === "ranking"
  );
}

export function isSemanticLoadRequest(
  value: unknown,
): value is SemanticLoadRequest {
  return (
    isRecord(value) &&
    value.type === "load" &&
    Number.isInteger(value.requestId)
  );
}

export function isSemanticRankRequest(
  value: unknown,
): value is SemanticRankRequest {
  return (
    isRecord(value) &&
    value.type === "rank" &&
    Number.isInteger(value.requestId) &&
    typeof value.query === "string" &&
    Array.isArray(value.candidates) &&
    value.candidates.every(isSemanticLayerInput)
  );
}

export function isSemanticWorkerResponse(
  value: unknown,
): value is SemanticWorkerResponse {
  if (
    !isRecord(value) ||
    !Number.isInteger(value.requestId) ||
    typeof value.type !== "string"
  ) {
    return false;
  }

  if (value.type === "progress") {
    return (
      isSemanticWorkerStage(value.stage) &&
      typeof value.cachedCandidates === "number" &&
      typeof value.totalCandidates === "number"
    );
  }

  if (value.type === "result") {
    return (
      typeof value.cacheHits === "number" &&
      typeof value.embeddedCandidates === "number" &&
      Array.isArray(value.scores) &&
      value.scores.every(isSemanticLayerScore) &&
      isSemanticWorkerTimings(value.timings)
    );
  }

  if (value.type === "ready") {
    return true;
  }

  return value.type === "error" && typeof value.message === "string";
}
