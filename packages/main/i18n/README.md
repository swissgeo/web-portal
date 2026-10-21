# Translations

The texts of the web-portal user interface are in `locales/<language>.json`.
All five files have the same keys in the same order.
A text without a translation has the value `TODO translate`.

## Translate in a spreadsheet

A developer does steps 1, 5 and 6, from the repository root and with Node.js 22.18 or newer.
The translator does steps 2 to 4 and sends the CSV file back.

1. Convert the JSON files to one CSV file: `node packages/main/scripts/i18nCsv.ts to-csv translations.csv`
2. Open the file:
   - Google Sheets: **File > Import > Upload**.
   - Excel: **Data > From Text/CSV**. Do not open the file with a double-click.
3. Change only the text cells. Do not add, delete, sort or move rows.
4. Save the file as CSV. In Excel, select **CSV UTF-8**.
5. Convert the CSV file back: `node packages/main/scripts/i18nCsv.ts to-json translations.csv`
6. Check the changes with `git diff`. Commit the JSON files, not the CSV file.

The JSON files are the source. The CSV file is only a temporary copy:
`to-json` overwrites all five files with it. So convert it back soon,
before other changes to the texts are merged.

## Add a new text

Add the key to `de.json`, then run `to-csv` and `to-json`.
This adds the key to the other files, with the value `TODO translate`.
