export const DATASET_TABS = [
  "overview",
  "legend",
  "data-access",
  "metadata",
] as const;

export type DatasetTab = (typeof DATASET_TABS)[number];

export const DEFAULT_DATASET_TAB: DatasetTab = "overview";

export function isDatasetTab(value: unknown): value is DatasetTab {
  return DATASET_TABS.some((tab) => tab === value);
}
