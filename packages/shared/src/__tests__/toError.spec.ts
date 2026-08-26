import { describe, expect, it } from "vitest";

import { toError } from "../utils/toError";

describe("toError", () => {
  it("returns an Error unchanged", () => {
    const error = new Error("failure", { cause: "root cause" });

    expect(toError(error)).toBe(error);
  });

  it.each([
    ["failure", "failure"],
    [404, "404"],
    [null, "null"],
    [undefined, "undefined"],
  ])("converts %s to an Error", (value, message) => {
    expect(toError(value)).toEqual(new Error(message));
  });
});
