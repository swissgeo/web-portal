import { describe, it, expect } from "vitest";

import { LV03Format } from "@/utils/coordinates/coordinateFormat";

import { positionStore, mockDispatcher } from "../__mocks__/stores";
import { DEFAULT_PROJECTION, DEFAULT_FORMAT } from "../../position";
import $reset from "../../position/actions/$reset";

describe("$reset", () => {
  it("should reset the store to its initial state", () => {
    positionStore.center = [600000, 200000];
    positionStore.zoom = 5;
    positionStore.rotation = 45;
    positionStore.displayFormat = LV03Format;

    expect(positionStore.center).not.toEqual(DEFAULT_PROJECTION.bounds.center);
    expect(positionStore.zoom).not.toBe(DEFAULT_PROJECTION.getDefaultZoom());
    expect(positionStore.rotation).not.toBe(0);
    expect(positionStore.displayFormat).not.toStrictEqual(DEFAULT_FORMAT);

    $reset.call(positionStore, mockDispatcher);

    expect(positionStore.center).toEqual(DEFAULT_PROJECTION.bounds.center);
    expect(positionStore.zoom).toBe(DEFAULT_PROJECTION.getDefaultZoom());
    expect(positionStore.rotation).toBe(0);
    expect(positionStore.displayFormat).toStrictEqual(DEFAULT_FORMAT);
  });
});
