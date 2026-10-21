/** Converts the locale files to one CSV file for translators, and back. See ../i18n/README.md */
import { readFileSync, writeFileSync } from "node:fs";

type Messages = { [key: string]: string | Messages };
type Entry = [key: string, text: string];

const LANGUAGES = ["de", "fr", "it", "rm", "en"];
const HEADER = ["key", ...LANGUAGES];
const BOM = "\uFEFF"; // makes spreadsheet tools read the file as UTF-8
export const PLACEHOLDER = "TODO translate";

/** `{ a: { b: "x" } }` -> `[["a.b", "x"]]` */
function flatten(messages: Messages, prefix = ""): Entry[] {
  return Object.entries(messages).flatMap(([key, value]) =>
    typeof value === "string"
      ? [[prefix + key, value] as Entry]
      : flatten(value, `${prefix}${key}.`),
  );
}

/** `[["a.b", "x"]]` -> `{ a: { b: "x" } }`. A key joins its group, even if the group started earlier. */
function nest(entries: Entry[]): Messages {
  const root: Messages = {};
  for (const [key, text] of entries) {
    const path = key.split(".");
    const leaf = path.pop() as string;
    let node = root;
    for (const part of path) {
      node = (node[part] ??= {}) as Messages;
    }
    node[leaf] = text;
  }
  return root;
}

/** One row per key of any file, in the order of the JSON files. A missing text becomes `PLACEHOLDER`. */
export function toCsv(locales: Messages[]): string {
  const entries = locales.map((messages) => flatten(messages));
  const texts = entries.map((entry) => new Map(entry));
  // Union of all keys, grouped like the JSON files (see nest()).
  const keys = flatten(nest(entries.flat()));
  const rows = keys.map(([key]) => [
    key,
    ...texts.map((text) => text.get(key) ?? PLACEHOLDER),
  ]);
  const lines = [HEADER, ...rows].map((row) =>
    row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","),
  );
  return `${BOM}${lines.join("\n")}\n`;
}

/** One locale per language column. Reads "," and ";" as delimiter, as Excel in Switzerland saves with ";". */
export function fromCsv(text: string): Messages[] {
  const csv = text.replace(/^\uFEFF/, "").replaceAll("\r\n", "\n");
  const delimiter = /^"?key"?;/.test(csv) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < csv.length; index++) {
    const char = csv[index];
    if (char === '"' && quoted && csv[index + 1] === '"') {
      cell += '"';
      index++;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (quoted || (char !== delimiter && char !== "\n")) {
      cell += char;
    } else {
      row.push(cell);
      cell = "";
      if (char === "\n") {
        rows.push(row);
        row = [];
      }
    }
  }
  rows.push([...row, cell]);

  const [header = [], ...body] = rows.filter((cells) =>
    cells.some((value) => value),
  );
  if (header.join() !== HEADER.join()) {
    throw new Error(`The first row must be: ${HEADER.join(",")}`);
  }
  for (const cells of body) {
    if (cells.length !== HEADER.length) {
      throw new Error(`Row "${cells[0]}" must have ${HEADER.length} cells`);
    }
  }
  return LANGUAGES.map((_, index) =>
    nest(body.map((cells) => [cells[0], cells[index + 1]] as Entry)),
  );
}

if (process.argv[1] === import.meta.filename) {
  const [command, file] = process.argv.slice(2);
  const localeFile = (language: string) =>
    new URL(`../i18n/locales/${language}.json`, import.meta.url);
  if (command === "to-csv" && file) {
    const locales = LANGUAGES.map((language) =>
      JSON.parse(readFileSync(localeFile(language), "utf8")),
    );
    writeFileSync(file, toCsv(locales));
  } else if (command === "to-json" && file) {
    const locales = fromCsv(readFileSync(file, "utf8"));
    LANGUAGES.forEach((language, index) =>
      writeFileSync(
        localeFile(language),
        `${JSON.stringify(locales[index], null, 2)}\n`,
      ),
    );
  } else {
    console.error(
      "Usage: node packages/main/scripts/i18nCsv.ts to-csv|to-json <file.csv>",
    );
    process.exit(1);
  }
}
