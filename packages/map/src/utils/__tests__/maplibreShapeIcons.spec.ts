import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@swissgeo/log", () => ({
  default: { debug: vi.fn(), error: vi.fn(), warn: vi.fn() },
  LogPreDefinedColor: new Proxy({}, { get: (_t, p) => String(p) }),
}));

import log from "@swissgeo/log";

import {
  createShapeIcon,
  makeGetImage,
  shapeIconName,
} from "../maplibreShapeIcons";

function makeFakeCtx() {
  return {
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillStyle: undefined as unknown,
    strokeStyle: undefined as unknown,
    lineWidth: undefined as unknown,
  };
}

describe("shapeIconName", () => {
  it("builds a deterministic name from the shape spec", () => {
    expect(
      shapeIconName({
        shape: "star",
        radius: 6,
        fillColor: "red",
        strokeColor: "black",
        strokeWidth: 2,
      }),
    ).toBe("sg-star-6-red-black-2");
  });

  it("defaults fill/stroke/width when not provided", () => {
    expect(shapeIconName({ shape: "circle", radius: 4 })).toBe(
      "sg-circle-4-none-none-0",
    );
  });
});

describe("createShapeIcon", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs and returns an empty canvas when the 2d context is unavailable", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);

    const canvas = createShapeIcon({ name: "n", shape: "circle", radius: 5 });

    expect(canvas).toBeInstanceOf(HTMLCanvasElement);
    expect(log.error).toHaveBeenCalledOnce();
  });

  it("draws a circle via ctx.arc", () => {
    const ctx = makeFakeCtx();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      ctx as unknown as CanvasRenderingContext2D,
    );

    createShapeIcon({
      name: "n",
      shape: "circle",
      radius: 5,
      fillColor: "red",
    });

    expect(ctx.arc).toHaveBeenCalledWith(5, 5, 5, 0, 2 * Math.PI);
    expect(ctx.moveTo).not.toHaveBeenCalled();
    expect(ctx.fill).toHaveBeenCalled();
  });

  it.each(["square", "triangle", "pentagon", "hexagon"] as const)(
    "draws a %s via moveTo/lineTo",
    (shape) => {
      const ctx = makeFakeCtx();
      vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
        ctx as unknown as CanvasRenderingContext2D,
      );

      createShapeIcon({ name: "n", shape, radius: 5 });

      expect(ctx.moveTo).toHaveBeenCalledOnce();
      expect(ctx.lineTo).toHaveBeenCalled();
      expect(ctx.closePath).toHaveBeenCalledOnce();
    },
  );

  it("draws a star/cross with an inner radius (twice the vertex count)", () => {
    const ctx = makeFakeCtx();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      ctx as unknown as CanvasRenderingContext2D,
    );

    createShapeIcon({ name: "n", shape: "star", radius: 6 });

    // 5 points * 2 (outer/inner) vertices => 1 moveTo + 9 lineTo
    expect(ctx.moveTo).toHaveBeenCalledOnce();
    expect(ctx.lineTo).toHaveBeenCalledTimes(9);
  });

  it("skips fill/stroke when not configured", () => {
    const ctx = makeFakeCtx();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      ctx as unknown as CanvasRenderingContext2D,
    );

    createShapeIcon({ name: "n", shape: "circle", radius: 5 });

    expect(ctx.fill).not.toHaveBeenCalled();
    expect(ctx.stroke).not.toHaveBeenCalled();
  });

  it("strokes when a strokeColor and a positive strokeWidth are given", () => {
    const ctx = makeFakeCtx();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      ctx as unknown as CanvasRenderingContext2D,
    );

    createShapeIcon({
      name: "n",
      shape: "circle",
      radius: 5,
      strokeColor: "blue",
      strokeWidth: 2,
    });

    expect(ctx.stroke).toHaveBeenCalled();
    expect(ctx.lineWidth).toBe(2);
  });

  it("does not stroke when strokeWidth is 0", () => {
    const ctx = makeFakeCtx();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      ctx as unknown as CanvasRenderingContext2D,
    );

    createShapeIcon({
      name: "n",
      shape: "circle",
      radius: 5,
      strokeColor: "blue",
      strokeWidth: 0,
    });

    expect(ctx.stroke).not.toHaveBeenCalled();
  });
});

describe("makeGetImage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("resolves a known shape name to a generated canvas and caches it", () => {
    const ctx = makeFakeCtx();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      ctx as unknown as CanvasRenderingContext2D,
    );

    const getImage = makeGetImage([
      { name: "sg-circle-5-none-none-0", shape: "circle", radius: 5 },
    ]);

    const first = getImage({} as never, "sg-circle-5-none-none-0");
    const second = getImage({} as never, "sg-circle-5-none-none-0");

    expect(first).toBeInstanceOf(HTMLCanvasElement);
    expect(first).toBe(second);
    expect(ctx.arc).toHaveBeenCalledOnce();
  });

  it("passes through http/https/data URLs for unknown names", () => {
    const getImage = makeGetImage([]);

    expect(getImage({} as never, "https://example.com/icon.png")).toBe(
      "https://example.com/icon.png",
    );
    expect(getImage({} as never, "data:image/png;base64,abc")).toBe(
      "data:image/png;base64,abc",
    );
  });

  it("returns undefined for an unknown, non-URL name", () => {
    const getImage = makeGetImage([]);

    expect(getImage({} as never, "not-a-known-icon")).toBeUndefined();
  });
});
