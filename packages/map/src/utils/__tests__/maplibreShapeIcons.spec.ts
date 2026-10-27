import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ShapeIconSpec } from "../maplibreShapeIcons";

import { createShapeIcon, createGetImageCallback } from "../maplibreShapeIcons";

function stubContext() {
  const ctx = {
    beginPath: vi.fn(),
    arc: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillStyle: undefined as string | undefined,
    strokeStyle: undefined as string | undefined,
    lineWidth: undefined as number | undefined,
  };
  return ctx;
}

let ctx: ReturnType<typeof stubContext>;

beforeEach(() => {
  ctx = stubContext();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    ctx as unknown as CanvasRenderingContext2D,
  );
});

describe("createShapeIcon", () => {
  it("sizes the canvas to fit the shape plus its stroke", () => {
    const canvas = createShapeIcon({
      name: "sg-circle-7",
      shape: "circle",
      radius: 7,
      strokeWidth: 3,
    });
    expect(canvas.width).toBe(20);
    expect(canvas.height).toBe(20);
  });

  it("draws a circle with a single arc", () => {
    createShapeIcon({
      name: "sg-circle-7",
      shape: "circle",
      radius: 7,
    });
    expect(ctx.arc).toHaveBeenCalledTimes(1);
    expect(ctx.arc).toHaveBeenCalledWith(7, 7, 7, 0, 2 * Math.PI);
  });

  it("draws a triangle with three vertices", () => {
    createShapeIcon({
      name: "sg-triangle-12",
      shape: "triangle",
      radius: 12,
    });
    expect(ctx.moveTo).toHaveBeenCalledTimes(1);
    expect(ctx.lineTo).toHaveBeenCalledTimes(2);
    expect(ctx.closePath).toHaveBeenCalled();
  });

  it("draws a star with alternating outer and inner radius (10 vertices)", () => {
    createShapeIcon({
      name: "sg-star-10",
      shape: "star",
      radius: 10,
    });
    expect(ctx.moveTo).toHaveBeenCalledTimes(1);
    expect(ctx.lineTo).toHaveBeenCalledTimes(9);
    const radii = ctx.lineTo.mock.calls.map(([x, y]) =>
      Math.hypot(x - 10, y - 10),
    );
    // inner vertices sit at half the outer radius (radius2 = radius / 2)
    for (const radius of radii) {
      expect(Math.abs(radius - 10) < 1e-6 || Math.abs(radius - 5) < 1e-6).toBe(
        true,
      );
    }
  });

  it("applies fill and stroke when colours are provided", () => {
    createShapeIcon({
      name: "sg-square-10",
      shape: "square",
      radius: 10,
      fillColor: "#808080",
      strokeColor: "#FFFFFF",
      strokeWidth: 1,
    });
    expect(ctx.fillStyle).toBe("#808080");
    expect(ctx.fill).toHaveBeenCalled();
    expect(ctx.strokeStyle).toBe("#FFFFFF");
    expect(ctx.lineWidth).toBe(1);
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it("returns the canvas without drawing when no 2d context is available", () => {
    vi.restoreAllMocks();
    const canvas = createShapeIcon({
      name: "sg-circle-7",
      shape: "circle",
      radius: 7,
    });
    expect(canvas).toBeInstanceOf(HTMLCanvasElement);
  });
});

describe("createGetImageCallback", () => {
  const specs: ShapeIconSpec[] = [
    {
      name: "sg-triangle-12-#808080-#FFFFFF-1",
      shape: "triangle",
      radius: 12,
      fillColor: "#808080",
      strokeColor: "#FFFFFF",
      strokeWidth: 1,
    },
  ];

  it("resolves a known icon name to a canvas", () => {
    const getImage = createGetImageCallback(specs);
    const image = getImage({} as never, "sg-triangle-12-#808080-#FFFFFF-1");
    expect(image).toBeInstanceOf(HTMLCanvasElement);
  });

  it("caches generated canvases per name", () => {
    const getImage = createGetImageCallback(specs);
    const first = getImage({} as never, "sg-triangle-12-#808080-#FFFFFF-1");
    const second = getImage({} as never, "sg-triangle-12-#808080-#FFFFFF-1");
    expect(second).toBe(first);
  });

  it.each(["https://data.geo.admin.ch/icon.png", "data:image/png;base64,x"])(
    "passes external icon URLs through (%s)",
    (name) => {
      const getImage = createGetImageCallback(specs);
      expect(getImage({} as never, name)).toBe(name);
    },
  );

  it("returns undefined for unknown non-URL names", () => {
    const getImage = createGetImageCallback(specs);
    expect(getImage({} as never, "not-a-known-icon")).toBeUndefined();
  });
});
