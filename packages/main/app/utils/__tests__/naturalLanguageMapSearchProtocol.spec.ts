import { describe, expect, it } from "vitest";

import {
  isSemanticRankRequest,
  isSemanticWorkerResponse,
} from "../naturalLanguageMapSearchProtocol";

describe("natural-language map search worker protocol", () => {
  it("accepts a valid rank request", () => {
    expect(
      isSemanticRankRequest({
        candidates: [{ id: "layer", text: "Layer description" }],
        query: "solar in Bern",
        requestId: 1,
        type: "rank",
      }),
    ).toBe(true);
  });

  it.each([
    undefined,
    { type: "rank", requestId: "one", query: "solar", candidates: [] },
    { type: "rank", requestId: 1, query: "solar", candidates: [{}] },
  ])("rejects malformed rank request %#", (value) => {
    expect(isSemanticRankRequest(value)).toBe(false);
  });

  it.each([
    {
      cachedCandidates: 2,
      requestId: 1,
      stage: "embedding",
      totalCandidates: 3,
      type: "progress",
    },
    {
      cacheHits: 2,
      embeddedCandidates: 1,
      requestId: 1,
      scores: [{ id: "layer", score: 0.8 }],
      timings: {
        embeddingMs: 10,
        modelMs: 20,
        rankingMs: 1,
        totalMs: 31,
      },
      type: "result",
    },
    { message: "failed", requestId: 1, type: "error" },
  ])("accepts valid worker response %#", (value) => {
    expect(isSemanticWorkerResponse(value)).toBe(true);
  });

  it.each([
    { requestId: 1, type: "progress", stage: "unknown" },
    { requestId: 1, type: "result", scores: [{ id: "layer" }] },
    { requestId: 1, type: "error", message: 2 },
  ])("rejects malformed worker response %#", (value) => {
    expect(isSemanticWorkerResponse(value)).toBe(false);
  });
});
