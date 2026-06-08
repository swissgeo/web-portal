import type { Lang } from "@/language";

// System Constants
export const ALLOWED_LANGUAGES: Lang[] = ["de", "fr", "en", "it", "rm"];
export const DRAWING_LAYER_ID = "user-drawing-layer";

// Projection constants
export const EPSG_4326_WGS84: string = "EPSG:4326";
export const EPSG_2056_CH1903: string = "EPSG:2056";

export const EPSG_2056_BOUNDING_BOX = [2420000, 1030000, 2900000, 1350000];
