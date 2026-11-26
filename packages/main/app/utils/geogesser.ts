/**
 * Geogesser: a hidden game. The user sees an aerial image of a random Swiss
 * place and clicks on the map where that place is. A click nearer to the place
 * gives more points.
 */

/** LV95 coordinate of a municipality, from the geo.admin.ch search service */
export type GeogesserPlace = { name: string; coordinate: [number, number] };

export const GEOGESSER_PLACES: GeogesserPlace[] = [
  { name: "Bern", coordinate: [2_598_634, 1_200_387] },
  { name: "Zürich", coordinate: [2_682_217, 1_247_945] },
  { name: "Genève", coordinate: [2_499_959, 1_117_840] },
  { name: "Basel", coordinate: [2_611_414, 1_267_104] },
  { name: "Lausanne", coordinate: [2_538_612, 1_153_353] },
  { name: "Lugano", coordinate: [2_720_031, 1_098_728] },
  { name: "Luzern", coordinate: [2_665_512, 1_211_883] },
  { name: "St. Gallen", coordinate: [2_747_115, 1_254_359] },
  { name: "Chur", coordinate: [2_758_514, 1_188_900] },
  { name: "Sion", coordinate: [2_592_608, 1_118_392] },
  { name: "Neuchâtel", coordinate: [2_562_705, 1_207_887] },
  { name: "Fribourg", coordinate: [2_578_866, 1_183_617] },
  { name: "Winterthur", coordinate: [2_696_563, 1_261_710] },
  { name: "Thun", coordinate: [2_612_916, 1_176_599] },
  { name: "Biel/Bienne", coordinate: [2_587_135, 1_222_071] },
  { name: "Schaffhausen", coordinate: [2_690_161, 1_286_052] },
  { name: "Locarno", coordinate: [2_711_536, 1_113_567] },
  { name: "Bellinzona", coordinate: [2_719_614, 1_118_850] },
  { name: "Zug", coordinate: [2_682_107, 1_222_853] },
  { name: "Aarau", coordinate: [2_645_864, 1_249_090] },
  { name: "Solothurn", coordinate: [2_606_907, 1_228_573] },
  { name: "Interlaken", coordinate: [2_633_662, 1_170_427] },
  { name: "Zermatt", coordinate: [2_623_512, 1_093_253] },
  { name: "Davos", coordinate: [2_784_107, 1_182_025] },
  { name: "St. Moritz", coordinate: [2_783_867, 1_151_049] },
  { name: "Montreux", coordinate: [2_561_374, 1_144_234] },
  { name: "Brig-Glis", coordinate: [2_641_339, 1_126_534] },
  { name: "Olten", coordinate: [2_634_378, 1_243_336] },
  { name: "Frauenfeld", coordinate: [2_710_481, 1_268_360] },
  { name: "Altdorf", coordinate: [2_691_428, 1_193_564] },
  { name: "Delémont", coordinate: [2_591_878, 1_246_763] },
  { name: "Yverdon-les-Bains", coordinate: [2_538_453, 1_179_975] },
  { name: "Martigny", coordinate: [2_573_851, 1_106_228] },
  { name: "Baden", coordinate: [2_664_346, 1_258_060] },
  { name: "Grindelwald", coordinate: [2_646_199, 1_163_373] },
  { name: "Andermatt", coordinate: [2_690_959, 1_163_987] },
  { name: "Einsiedeln", coordinate: [2_701_486, 1_219_692] },
  { name: "Appenzell", coordinate: [2_747_949, 1_244_297] },
  { name: "Nyon", coordinate: [2_507_224, 1_137_612] },
  { name: "Vevey", coordinate: [2_553_430, 1_143_594] },
  { name: "Rapperswil-Jona", coordinate: [2_707_620, 1_231_934] },
  { name: "Arosa", coordinate: [2_772_430, 1_185_764] },
  { name: "Scuol", coordinate: [2_816_315, 1_186_069] },
  { name: "Poschiavo", coordinate: [2_801_061, 1_135_779] },
  { name: "Saas-Fee", coordinate: [2_635_559, 1_103_870] },
  { name: "La Chaux-de-Fonds", coordinate: [2_554_856, 1_218_308] },
  { name: "Engelberg", coordinate: [2_675_567, 1_185_777] },
  { name: "Sarnen", coordinate: [2_657_013, 1_193_898] },
];

/** The search text that starts the game */
export const GEOGESSER_TRIGGER = "geoguessinggame";

/** Largest distance in meters between the target and the place center */
export const GEOGESSER_MAX_OFFSET = 1_000;
export const GEOGESSER_MAX_POINTS = 5_000;
/** Distance in meters at which a guess keeps about 37% of the points */
export const GEOGESSER_DISTANCE_SCALE = 15_000;
/** Part of the points that each "bigger view" step removes */
export const GEOGESSER_ZOOM_OUT_PENALTY = 0.15;
export const GEOGESSER_MAX_ZOOM_OUTS = 5;
export const GEOGESSER_ROUND_SECONDS = 90;

/**
 * Width in meters of the area that the aerial image shows at the start. An
 * easier level shows more and gives fewer points.
 */
export const GEOGESSER_DIFFICULTIES = {
  easy: { width: 10_000, factor: 0.3 },
  medium: { width: 1_000, factor: 0.6 },
  hard: { width: 100, factor: 1 },
} as const;
export type GeogesserDifficulty = keyof typeof GEOGESSER_DIFFICULTIES;

export function isGeogesserTrigger(query: string): boolean {
  return query.trim().toLowerCase() === GEOGESSER_TRIGGER;
}

/**
 * A random place with a random offset, so that the image does not always show
 * the same town center.
 */
export function pickGeogesserTarget(random: () => number = Math.random): {
  name: string;
  coordinate: [number, number];
} {
  const place =
    GEOGESSER_PLACES[Math.floor(random() * GEOGESSER_PLACES.length)] ??
    GEOGESSER_PLACES[0]!;
  const offset = () => (random() * 2 - 1) * GEOGESSER_MAX_OFFSET;
  return {
    name: place.name,
    coordinate: [
      Math.round(place.coordinate[0] + offset()),
      Math.round(place.coordinate[1] + offset()),
    ],
  };
}

/** LV95 is a metric projection: the plane distance is the distance in meters */
export function geogesserDistance(
  from: readonly number[],
  to: readonly number[],
): number {
  return Math.hypot(to[0]! - from[0]!, to[1]! - from[1]!);
}

export function geogesserScore(
  distance: number,
  zoomOuts: number,
  factor = 1,
): number {
  const distancePoints =
    GEOGESSER_MAX_POINTS * Math.exp(-distance / GEOGESSER_DISTANCE_SCALE);
  const penalty = Math.max(0, 1 - zoomOuts * GEOGESSER_ZOOM_OUT_PENALTY);
  return Math.round(distancePoints * penalty * factor);
}

export function formatGeogesserDistance(distance: number): string {
  return distance >= 1000
    ? `${(distance / 1000).toFixed(1)} km`
    : `${Math.round(distance)} m`;
}
