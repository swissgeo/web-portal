import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type WorkerListener = (_event: ErrorEvent | MessageEvent<unknown>) => void;

class FakeWorker {
  static instances: FakeWorker[] = [];

  listeners = new Map<string, WorkerListener[]>();
  messages: unknown[] = [];
  terminated = false;

  constructor() {
    FakeWorker.instances.push(this);
  }

  addEventListener(type: string, listener: WorkerListener): void {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  postMessage(message: unknown): void {
    this.messages.push(message);
  }

  terminate(): void {
    this.terminated = true;
  }

  emitMessage(data: unknown): void {
    this.listeners
      .get("message")
      ?.forEach((listener) => listener({ data } as MessageEvent<unknown>));
  }
}

describe("natural-language map search worker client", () => {
  beforeEach(() => {
    FakeWorker.instances = [];
    vi.resetModules();
    vi.stubGlobal("Worker", FakeWorker);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads the model once for concurrent callers", async () => {
    const { preloadModelWithWorker } =
      await import("../naturalLanguageMapSearchWorker.client");

    const firstLoad = preloadModelWithWorker();
    const secondLoad = preloadModelWithWorker();
    const [worker] = FakeWorker.instances;

    expect(secondLoad).toBe(firstLoad);
    expect(worker?.messages).toEqual([{ requestId: 1, type: "load" }]);

    worker?.emitMessage({ requestId: 1, type: "ready" });

    await expect(Promise.all([firstLoad, secondLoad])).resolves.toEqual([
      undefined,
      undefined,
    ]);
  });

  it("allows retry after model loading fails", async () => {
    const { preloadModelWithWorker } =
      await import("../naturalLanguageMapSearchWorker.client");

    const firstLoad = preloadModelWithWorker();
    const [worker] = FakeWorker.instances;
    const firstFailure = expect(firstLoad).rejects.toThrow("download failed");

    worker?.emitMessage({
      message: "download failed",
      requestId: 1,
      type: "error",
    });
    await firstFailure;

    const retry = preloadModelWithWorker();
    expect(worker?.messages).toEqual([
      { requestId: 1, type: "load" },
      { requestId: 2, type: "load" },
    ]);

    worker?.emitMessage({ requestId: 2, type: "ready" });
    await expect(retry).resolves.toBeUndefined();
  });

  it("rejects ranking before explicit model loading", async () => {
    const { rankLayersWithWorker } =
      await import("../naturalLanguageMapSearchWorker.client");

    await expect(rankLayersWithWorker("solar", [])).rejects.toThrow(
      "Load the semantic model before searching",
    );
    expect(FakeWorker.instances).toHaveLength(0);
  });
});
