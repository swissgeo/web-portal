import type { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";

// reproject ships no type declarations. Typing it here (instead of in an
// ambient `declare module` file) keeps the types with the code, so whoever
// compiles this package's source gets them too.
// @ts-expect-error TS7016: no declaration file for module "reproject"
import { reproject as untypedReproject } from "reproject";

interface Reproject {
  (
    input: FeatureCollection<Geometry, GeoJsonProperties>,
    from: string,
    to: string,
    projs?: Record<string, string>,
  ): FeatureCollection<Geometry, GeoJsonProperties>;
  (
    input: Geometry,
    from: string,
    to: string,
    projs?: Record<string, string>,
  ): Geometry;
}

export const reproject: Reproject = untypedReproject;
