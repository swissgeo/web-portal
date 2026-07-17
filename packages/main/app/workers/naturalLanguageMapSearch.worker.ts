import type { FeatureExtractionPipeline } from "@huggingface/transformers";

import { pipeline } from "@huggingface/transformers";

import type {
  SemanticLayerInput,
  SemanticProgressResponse,
  SemanticRankRequest,
  SemanticResultResponse,
  SemanticWorkerResponse,
  SemanticWorkerTimings,
} from "../utils/naturalLanguageMapSearchProtocol";

import { rankCandidateEmbeddings } from "../utils/naturalLanguageMapSearch";
import { isSemanticRankRequest } from "../utils/naturalLanguageMapSearchProtocol";

const MODEL_ID = "Xenova/paraphrase-multilingual-MiniLM-L12-v2";
const RESULT_LIMIT = 3;

interface CachedEmbedding {
  text: string;
  vector: Float32Array;
}

const embeddingCache = new Map<string, CachedEmbedding>();
let extractorPromise: Promise<FeatureExtractionPipeline> | undefined;

function send(response: SemanticWorkerResponse): void {
  self.postMessage(response);
}

function sendProgress(
  request: SemanticRankRequest,
  stage: SemanticProgressResponse["stage"],
  cachedCandidates: number,
): void {
  send({
    cachedCandidates,
    requestId: request.requestId,
    stage,
    totalCandidates: request.candidates.length,
    type: "progress",
  });
}

async function loadExtractor(): Promise<FeatureExtractionPipeline> {
  extractorPromise ??= pipeline("feature-extraction", MODEL_ID, {
    device: "wasm",
    dtype: "q8",
  });
  return extractorPromise;
}

function cachedCandidate(
  candidate: SemanticLayerInput,
): CachedEmbedding | undefined {
  const cached = embeddingCache.get(candidate.id);
  return cached?.text === candidate.text ? cached : undefined;
}

function readVector(
  data: Float32Array,
  vectorSize: number,
  row: number,
): Float32Array {
  const start = row * vectorSize;
  return data.slice(start, start + vectorSize);
}

function makeRankingMatrix(
  queryVector: Float32Array,
  vectorSize: number,
  candidates: readonly SemanticLayerInput[],
): Float32Array {
  const matrix = new Float32Array(vectorSize * (candidates.length + 1));
  matrix.set(queryVector);

  candidates.forEach((candidate, index) => {
    const cached = cachedCandidate(candidate);
    if (!cached || cached.vector.length !== vectorSize) {
      throw new Error(`Missing cached embedding for ${candidate.id}`);
    }
    matrix.set(cached.vector, (index + 1) * vectorSize);
  });
  return matrix;
}

function elapsed(start: number): number {
  return Math.round((performance.now() - start) * 10) / 10;
}

async function rank(request: SemanticRankRequest): Promise<void> {
  const totalStart = performance.now();
  const missingCandidates = request.candidates.filter(
    (candidate) => !cachedCandidate(candidate),
  );
  const cacheHits = request.candidates.length - missingCandidates.length;

  sendProgress(request, "loading-model", cacheHits);
  const modelStart = performance.now();
  const extractor = await loadExtractor();
  const modelMs = elapsed(modelStart);

  sendProgress(request, "embedding", cacheHits);
  const embeddingStart = performance.now();
  const inputs = [request.query, ...missingCandidates.map(({ text }) => text)];
  const output = await extractor(inputs, {
    normalize: true,
    pooling: "mean",
  });
  const outputData = output.data;

  if (
    output.type !== "float32" ||
    !(outputData instanceof Float32Array) ||
    output.dims[0] !== inputs.length
  ) {
    throw new Error("The model returned unexpected embeddings");
  }

  const vectorSize = output.dims[1] ?? 0;
  if (vectorSize <= 0) {
    throw new Error("The model returned empty embeddings");
  }

  const queryVector = readVector(outputData, vectorSize, 0);
  missingCandidates.forEach((candidate, index) => {
    embeddingCache.set(candidate.id, {
      text: candidate.text,
      vector: readVector(outputData, vectorSize, index + 1),
    });
  });
  const embeddingMs = elapsed(embeddingStart);

  sendProgress(request, "ranking", cacheHits);
  const rankingStart = performance.now();
  const matrix = makeRankingMatrix(queryVector, vectorSize, request.candidates);
  const scores = rankCandidateEmbeddings(
    matrix,
    vectorSize,
    request.candidates.map(({ id }) => id),
    RESULT_LIMIT,
  );
  const rankingMs = elapsed(rankingStart);

  const timings: SemanticWorkerTimings = {
    embeddingMs,
    modelMs,
    rankingMs,
    totalMs: elapsed(totalStart),
  };
  const response: SemanticResultResponse = {
    cacheHits,
    embeddedCandidates: missingCandidates.length,
    requestId: request.requestId,
    scores,
    timings,
    type: "result",
  };
  send(response);
}

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

self.addEventListener("message", (event: MessageEvent<unknown>) => {
  if (!isSemanticRankRequest(event.data)) {
    return;
  }

  const request = event.data;
  void rank(request).catch((error: unknown) => {
    send({
      message: messageFrom(error),
      requestId: request.requestId,
      type: "error",
    });
  });
});
