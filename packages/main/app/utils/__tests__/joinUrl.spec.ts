import { describe, expect, it } from "vitest";

type NonEmptyStringArray = [string, ...string[]];

describe("joinURL", () => {
  it.each([
    {
      list: ["http://swissgeo.ch", "/en"] as NonEmptyStringArray,
      result: "http://swissgeo.ch/en",
    },
    {
      list: ["http://swissgeo.ch", "/en/"] as NonEmptyStringArray,
      result: "http://swissgeo.ch/en/",
    },
    {
      list: ["http://swissgeo.ch"] as NonEmptyStringArray,
      result: "http://swissgeo.ch/",
    },
    {
      list: ["http://swissgeo.ch/", "/en"] as NonEmptyStringArray,
      result: "http://swissgeo.ch/en",
    },
    {
      list: ["http://swissgeo.ch/", "/en", "map"] as NonEmptyStringArray,
      result: "http://swissgeo.ch/en/map",
    },
    {
      list: ["http://swissgeo.ch/", "/en", "map/"] as NonEmptyStringArray,
      result: "http://swissgeo.ch/en/map/",
    },
    {
      list: ["http://swissgeo.ch/", "/en/map", "/deep"] as NonEmptyStringArray,
      result: "http://swissgeo.ch/en/map/deep",
    },
  ])("concatenates the URL correctly from %s", ({ list, result }) => {
    const url = joinURL(list[0], ...list.slice(1));
    expect(url).toEqual(result);
  });
});
