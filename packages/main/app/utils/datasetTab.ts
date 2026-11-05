/** The tabs of the dataset detail view, in display order. */
export const DATASET_TABS = [
  "overview",
  "legend",
  "data-access",
  "metadata",
] as const;

/** One tab of the dataset detail view. Also the `tab` query value in the URL. */
export type DatasetTab = (typeof DATASET_TABS)[number];

/** The tab that opens when the URL has no `tab` query. */
export const DEFAULT_DATASET_TAB: DatasetTab = "overview";

/**
 * Tells if a value is a known tab, e.g. a `tab` query value from the URL.
 * @param value - The value to check
 * @returns True when the value is one of {@link DATASET_TABS}
 */
export function isDatasetTab(value: unknown): value is DatasetTab {
  return DATASET_TABS.some((tab) => tab === value);
}
