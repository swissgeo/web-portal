import { describe, expect, it } from "vitest";

import {
  isSemanticLoadRequest,
  isSemanticRankRequest,
  isSemanticWorkerResponse,
} from "../naturalLanguageMapSearchProtocol";

describe("natural-language map search worker protocol", () => {
  it("accepts a valid model load request", () => {
    expect(isSemanticLoadRequest({ requestId: 1, type: "load" })).toBe(true);
  });

  it.each([
    undefined,
    { type: "load", requestId: "one" },
    { type: "rank", requestId: 1 },
  ])("rejects malformed model load request %#", (value) => {
    expect(isSemanticLoadRequest(value)).toBe(false);
  });

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
    { requestId: 1, type: "ready" },
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
