import { describe, expect, it } from "vitest";

import { fromCsv, PLACEHOLDER, toCsv } from "../i18nCsv";

describe("i18nCsv", () => {
  it("fills missing texts and keeps every key in its group", () => {
    const de = {
      menu: { search: "Suche", close: 'Schliessen, "jetzt"' },
      map: { title: "Karte" },
    };
    const en = {
      map: { title: "Map" },
      menu: { search: "Search", extra: "Only in EN" },
    };

    const [newDe, , , , newEn] = fromCsv(toCsv([de, {}, {}, {}, en]));

    // Compared as JSON text, because toEqual() ignores the key order.
    expect(JSON.stringify(newDe)).toBe(
      JSON.stringify({
        menu: {
          search: "Suche",
          close: 'Schliessen, "jetzt"',
          extra: PLACEHOLDER,
        },
        map: { title: "Karte" },
      }),
    );
    expect(JSON.stringify(newEn)).toBe(
      JSON.stringify({
        menu: { search: "Search", close: PLACEHOLDER, extra: "Only in EN" },
        map: { title: "Map" },
      }),
    );
  });

  it("reads a file saved in Excel's format with semicolons", () => {
    expect(
      fromCsv(
        'key;de;fr;it;rm;en\r\nmenu.search;"Suche; ""blah""";b;c;d;e\r\n',
      ),
    ).toEqual([
      { menu: { search: 'Suche; "blah"' } },
      { menu: { search: "b" } },
      { menu: { search: "c" } },
      { menu: { search: "d" } },
      { menu: { search: "e" } },
    ]);
  });
});
