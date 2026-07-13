export interface Dimension {
  currentValue: string | null;
  availableValues: string[];
}

/**
 * In the current implementation, `time` is the only dimension we are handling.
 * Should other dimensions be added, their ids would be added to this type.
 */
export type DimensionId = "time";

export type DimensionRecord = Partial<Record<DimensionId, Dimension>>;
