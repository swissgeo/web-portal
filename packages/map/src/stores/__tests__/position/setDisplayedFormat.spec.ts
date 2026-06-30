import { describe, it, expect } from "vitest";

import { LV95Format, LV03Format } from "@/utils/coordinates/coordinateFormat";

import { positionStore, mockDispatcher } from "../__mocks__/stores";
import setDisplayedFormat from "../../position/actions/setDisplayedFormat";

describe("setDisplayedFormat", () => {
  it("should set displayedFormat to LV95Format", () => {
    setDisplayedFormat.call(positionStore, LV95Format, mockDispatcher);
    expect(positionStore.displayFormat).toEqual(LV95Format);
  });

  it("should set displayedFormat to LV03Format", () => {
    setDisplayedFormat.call(positionStore, LV03Format, mockDispatcher);
    expect(positionStore.displayFormat).toEqual(LV03Format);
  });
});
