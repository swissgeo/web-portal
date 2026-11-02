import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { flatten } from "../i18nCsv";

const localesDir = join(import.meta.dirname, "../../i18n/locales");
const languages = readdirSync(localesDir).map((file) =>
  file.replace(".json", ""),
);

function keysOf(language: string): string[] {
  const file = join(localesDir, `${language}.json`);
  return flatten(JSON.parse(readFileSync(file, "utf8"))).map(([key]) => key);
}

describe("locale files", () => {
  it.each(languages)(
    "%s.json has the same keys in the same order as de.json",
    (language) => {
      expect(keysOf(language)).toEqual(keysOf("de"));
    },
  );
});
