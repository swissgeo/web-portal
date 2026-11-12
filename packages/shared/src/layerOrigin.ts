/**
 * The record or file that a map layer comes from. Use it for messages only,
 * never to call an external service.
 */
export type LayerOrigin =
  | { kind: "dataset"; datasetId: string }
  | { kind: "file"; fileName: string };

/** Names the origin in messages, e.g. "dataset dat_x" or "file x.kml". */
export function describeLayerOrigin(origin: LayerOrigin): string {
  switch (origin.kind) {
    case "dataset":
      return `dataset ${origin.datasetId}`;
    case "file":
      return `file ${origin.fileName}`;
    default: {
      // A new origin kind fails type-check here until it gets its own text
      const unknownOrigin: never = origin;
      return unknownOrigin;
    }
  }
}
