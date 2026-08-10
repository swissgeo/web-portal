import { expect, it } from "vitest";

import { _SOME_DUMMY_EXPORT } from "./geoJsonStyle.d.ts";

it("_SOME_DUMMY_EXPORT is defined", () => {
  expect(_SOME_DUMMY_EXPORT).toBe(
    "just so that it is not only type exports...",
  );
});
