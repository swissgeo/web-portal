# Translations

The texts of the web-portal user interface are in `locales/<language>.json`.
All five files have the same keys in the same order.
A text without a translation has the value `TODO translate`.

## Translate in a spreadsheet

A developer does steps 1, 2, 5 and 6, from the repository root and with Node.js 22.18 or newer.
The translators do steps 3 and 4.

1. Convert the JSON files to one CSV file: `node packages/main/scripts/i18nCsv.ts to-csv translations.csv`
2. Share the file as one sheet where several translators can work in parallel:
   - Google Sheets: **File > Import > Upload**.
   - Excel on SharePoint or OneDrive: **Data > From Text/CSV**. Do not open the file with a double-click.
3. Check the German (DE) column first. The other languages use it as reference.
4. Change only the text cells. Do not add, delete, sort or move rows.
5. When all translators are done, save the sheet as CSV (in Excel: **CSV UTF-8**).
   Convert it back: `node packages/main/scripts/i18nCsv.ts to-json translations.csv`
6. Check the changes with `git diff`. Commit the JSON files, not the CSV file.

The JSON files are the source. `to-json` overwrites all five files with the CSV file.
If the sheet was open for a long time:

1. Run `to-json` on the same commit you exported from. Do not rebase first.
2. Commit, then rebase onto `develop`.
3. Run `to-csv` and `to-json` again.
   Texts that were added on `develop` in the meantime then appear as `TODO translate`.

## Add a new text

Add the key to `de.json`, then run `to-csv` and `to-json`.
This adds the key to the other files, with the value `TODO translate`.
