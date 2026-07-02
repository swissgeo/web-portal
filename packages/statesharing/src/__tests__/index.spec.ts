import { describe, expect, it } from "vitest";

import {
  APP_STATE_CONFIG_VERSION,
  ReadAppStateValidator,
  SaveAppStateResponseValidator,
  SaveAppStateValidator,
  StatePayloadValidator,
} from "../index";

describe("APP_STATE_CONFIG_VERSION", () => {
  it("is 1.0", () => {
    expect(APP_STATE_CONFIG_VERSION).toBe("1.0");
  });
});

describe("StatePayloadValidator", () => {
  it("accepts an empty state", () => {
    expect(() => StatePayloadValidator.parse({})).not.toThrow();
  });

  it("accepts a full valid state", () => {
    const result = StatePayloadValidator.parse({
      map: { center: [2660000, 1190000], zoom: 5, rotation: 0 },
      layers: [
        {
          layerUrl: "https://example.com/layer",
          type: "dataset",
          isVisible: true,
          opacity: 1,
        },
      ],
    });
    expect(result.map?.zoom).toBe(5);
    expect(result.layers).toHaveLength(1);
  });

  it("accepts a layer with time dimension", () => {
    const result = StatePayloadValidator.parse({
      layers: [
        {
          layerUrl: "https://example.com/layer",
          type: "dataset",
          dimensions: { time: { currentValue: "current" } },
        },
      ],
    });
    expect(result.layers?.[0]?.dimensions?.time?.currentValue).toBe("current");
  });

  it("rejects an invalid layer type", () => {
    expect(() =>
      StatePayloadValidator.parse({
        layers: [{ layerUrl: "https://example.com/layer", type: "invalid" }],
      }),
    ).toThrow();
  });

  it("rejects a zoom value above the maximum", () => {
    expect(() => StatePayloadValidator.parse({ map: { zoom: 99 } })).toThrow();
  });
});

describe("SaveAppStateValidator", () => {
  it("accepts a valid state envelope", () => {
    const result = SaveAppStateValidator.parse({
      state: {
        map: { center: [2660000, 1190000], zoom: 3, rotation: 0 },
        layers: [],
      },
    });
    expect(result.state.map?.zoom).toBe(3);
  });

  it("rejects a payload missing the state field", () => {
    expect(() => SaveAppStateValidator.parse({})).toThrow();
  });
});

describe("ReadAppStateValidator", () => {
  it("accepts a valid response", () => {
    const result = ReadAppStateValidator.parse({
      state: { map: { zoom: 2 }, layers: [] },
      deprecated: false,
      warning: "",
    });
    expect(result.deprecated).toBe(false);
  });

  it("applies default values for deprecated and warning", () => {
    const result = ReadAppStateValidator.parse({
      state: {},
    });
    expect(result.deprecated).toBe(false);
    expect(result.warning).toBe("");
  });
});

describe("SaveAppStateResponseValidator", () => {
  it("accepts a valid response", () => {
    const result = SaveAppStateResponseValidator.parse({
      id: "abcdefghijklmnop",
      deprecated: false,
      warning: "",
    });
    expect(result.id).toBe("abcdefghijklmnop");
  });

  it("rejects an id shorter than 16 characters", () => {
    expect(() =>
      SaveAppStateResponseValidator.parse({
        id: "tooshort",
        deprecated: false,
        warning: "",
      }),
    ).toThrow();
  });

  it("applies default values for deprecated and warning", () => {
    const result = SaveAppStateResponseValidator.parse({
      id: "abcdefghijklmnop",
    });
    expect(result.deprecated).toBe(false);
    expect(result.warning).toBe("");
  });
});
