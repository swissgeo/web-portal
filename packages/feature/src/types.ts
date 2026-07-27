export interface FeatureData {
  content: string | Record<string, string | number | boolean>;
  geometry: unknown;
  featureId: string | number;
}
