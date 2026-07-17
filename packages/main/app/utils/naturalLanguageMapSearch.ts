export interface NaturalLanguageCatalogRecord {
  id: string;
  properties?: {
    description?: string;
    keywords?: string[];
    title?: string;
  };
}

export interface LayerMatch {
  layer: NaturalLanguageCatalogRecord;
  score: number;
}

export interface LayerScore {
  id: string;
  score: number;
}

interface CatalogSearchDocument {
  description: string;
  keywords: string;
  record: NaturalLanguageCatalogRecord;
  title: string;
}

interface ScoredCatalogRecord {
  document: CatalogSearchDocument;
  score: number;
}

const STOP_WORDS = new Set([
  "add",
  "and",
  "auf",
  "aux",
  "bei",
  "can",
  "data",
  "demain",
  "der",
  "die",
  "domani",
  "eine",
  "for",
  "heute",
  "ich",
  "kann",
  "les",
  "map",
  "mir",
  "morgen",
  "mostra",
  "near",
  "please",
  "show",
  "the",
  "tomorrow",
  "voir",
  "with",
  "zeige",
]);

const TOKEN_PATTERN = /[\p{L}\p{N}]+/gu;

// we should add more expansions here :)
const QUERY_EXPANSIONS = [
  {
    pattern:
      /(?:hike\p{L}*|hiking|wander\p{L}*|sentier\p{L}*|randonn\p{L}*|escursion\p{L}*|cammin\p{L}*)/iu,
    text: "hiking walking trails Wanderwege sentiers pédestres percorsi escursionistici",
  },
  {
    pattern: /(?:solar\p{L}*|photovolta\p{L}*|solaire\p{L}*|solare\p{L}*)/iu,
    text: "solar panels photovoltaic roof rooftop suitability Solarpanel panneaux solaires tetto",
  },
  {
    pattern:
      /(?:bicycle\p{L}*|cycling|velo\p{L}*|vélo\p{L}*|fahrrad\p{L}*|biciclett\p{L}*|ciclabil\p{L}*)/iu,
    text: "cycling bicycle routes Veloland vélo pistes cyclables percorsi ciclabili bicicletta",
  },
  {
    pattern:
      /(?:public transport|öffentliche\p{L}* verkehr|transport\p{L}* public\p{L}*|trasport\p{L}* pubblic\p{L}*)/iu,
    text: "public transport stops stations öffentlicher Verkehr transports publics trasporti pubblici",
  },
] as const;

export function expandLayerQuery(query: string): string {
  const expansions = QUERY_EXPANSIONS.filter(({ pattern }) =>
    pattern.test(query),
  ).map(({ text }) => text);
  return [query, ...expansions].join(" ");
}

function normalizeText(value: string): string {
  return value.normalize("NFKD").replace(/\p{M}/gu, "").toLocaleLowerCase();
}

function meaningfulTokens(value: string): string[] {
  return (normalizeText(value).match(TOKEN_PATTERN) ?? []).filter(
    (token) => token.length >= 3 && !STOP_WORDS.has(token),
  );
}

function commonPrefixLength(left: string, right: string): number {
  const maximum = Math.min(left.length, right.length);
  let length = 0;
  while (length < maximum && left[length] === right[length]) {
    length += 1;
  }
  return length;
}

function fieldContainsToken(field: string, token: string): boolean {
  if (field.includes(token)) {
    return true;
  }

  return (field.match(TOKEN_PATTERN) ?? []).some((fieldToken) => {
    const shorterLength = Math.min(fieldToken.length, token.length);
    const prefixLength = commonPrefixLength(fieldToken, token);
    return (
      shorterLength >= 4 &&
      (fieldToken.startsWith(token) ||
        token.startsWith(fieldToken) ||
        prefixLength >= Math.max(4, Math.ceil(shorterLength * 0.7)))
    );
  });
}

function makeSearchDocument(
  record: NaturalLanguageCatalogRecord,
): CatalogSearchDocument {
  return {
    description: normalizeText(record.properties?.description ?? ""),
    keywords: normalizeText(record.properties?.keywords?.join(" ") ?? ""),
    record,
    title: normalizeText(record.properties?.title ?? record.id),
  };
}

function scoreDocument(
  tokens: readonly string[],
  document: CatalogSearchDocument,
): number {
  return tokens.reduce((score, token) => {
    return (
      score +
      (fieldContainsToken(document.title, token) ? 5 : 0) +
      (fieldContainsToken(document.keywords, token) ? 3 : 0) +
      (fieldContainsToken(document.description, token) ? 1 : 0)
    );
  }, 0);
}

const CURRENT_LOCATION_PATTERNS = [
  /\b(?:at|near|to) (?:my )?(?:home|house|location)\b/iu,
  /\b(?:bei mir|mein(?:em)? (?:haus|zuhause)|meine(?:m)? standort)\b/iu,
  /\b(?:chez moi|près de moi|ma maison|ma position)\b/iu,
  /\b(?:a casa mia|vicino a me|la mia casa|la mia posizione)\b/iu,
];

const TEMPORAL_WORDS =
  /\b(?:today|tomorrow|tonight|heute|morgen|demain|ce soir|aujourd'hui|oggi|domani|stasera)\b.*$/iu;

const ENGLISH_PLACE_PATTERN =
  /\b(?:in|near|around|at)\s+([\p{L}][\p{L}'’-]*(?:\s+[\p{L}][\p{L}'’-]*){0,2})/giu;

const PLACE_PATTERNS: Readonly<Record<string, RegExp>> = {
  de: /\b(?:in|bei|nach|um|für|hat)\s+([\p{L}][\p{L}'’-]*(?:\s+[\p{L}][\p{L}'’-]*){0,2})/giu,
  en: /\b(?:in|near|around|at|for|has|have)\s+([\p{L}][\p{L}'’-]*(?:\s+[\p{L}][\p{L}'’-]*){0,2})/giu,
  fr: /\b(?:a|à|au|aux|près de|autour de|pour)\s+([\p{L}][\p{L}'’-]*(?:\s+[\p{L}][\p{L}'’-]*){0,2})/giu,
  it: /\b(?:a|ad|ha|in|vicino a|per)\s+([\p{L}][\p{L}'’-]*(?:\s+[\p{L}][\p{L}'’-]*){0,2})/giu,
};

export function refersToCurrentLocation(query: string): boolean {
  return CURRENT_LOCATION_PATTERNS.some((pattern) => pattern.test(query));
}

export function extractPlaceQuery(
  query: string,
  locale: string,
): string | undefined {
  const preferredPattern = PLACE_PATTERNS[locale] ?? ENGLISH_PLACE_PATTERN;
  const patterns = [
    preferredPattern,
    ...Object.entries(PLACE_PATTERNS)
      .filter(([language]) => language !== locale)
      .map(([, pattern]) => pattern),
  ];

  let latestMatch: { index: number; place: string } | undefined;
  for (const pattern of patterns) {
    for (const match of query.matchAll(pattern)) {
      const place = match[1]?.replace(TEMPORAL_WORDS, "").trim();
      const index = match.index ?? 0;
      if (place && (!latestMatch || index >= latestMatch.index)) {
        latestMatch = { index, place };
      }
    }
  }
  return latestMatch?.place;
}

export function isCatalogRecord(
  value: unknown,
): value is NaturalLanguageCatalogRecord {
  if (
    value === null ||
    typeof value !== "object" ||
    !("id" in value) ||
    typeof value.id !== "string"
  ) {
    return false;
  }

  if (!("properties" in value) || value.properties === undefined) {
    return true;
  }
  if (value.properties === null || typeof value.properties !== "object") {
    return false;
  }

  const properties = value.properties;
  return (
    (!("description" in properties) ||
      properties.description === undefined ||
      typeof properties.description === "string") &&
    (!("title" in properties) ||
      properties.title === undefined ||
      typeof properties.title === "string") &&
    (!("keywords" in properties) ||
      properties.keywords === undefined ||
      (Array.isArray(properties.keywords) &&
        properties.keywords.every((keyword) => typeof keyword === "string")))
  );
}

export function findCatalogCandidates(
  query: string,
  records: readonly NaturalLanguageCatalogRecord[],
  limit: number = 24,
): NaturalLanguageCatalogRecord[] {
  const tokens = meaningfulTokens(query);
  if (tokens.length === 0) {
    return [];
  }

  const documents = records.map(makeSearchDocument);
  const selected = new Map<string, NaturalLanguageCatalogRecord>();

  for (const token of tokens) {
    documents
      .map(
        (document): ScoredCatalogRecord => ({
          document,
          score: scoreDocument([token], document),
        }),
      )
      .filter(({ score }) => score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, 2)
      .forEach(({ document }) => {
        if (selected.size < limit) {
          selected.set(document.record.id, document.record);
        }
      });
  }

  documents
    .map(
      (document): ScoredCatalogRecord => ({
        document,
        score: scoreDocument(tokens, document),
      }),
    )
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score)
    .forEach(({ document }) => {
      if (selected.size < limit) {
        selected.set(document.record.id, document.record);
      }
    });

  return [...selected.values()];
}

export function semanticText(record: NaturalLanguageCatalogRecord): string {
  return [
    record.properties?.title ?? record.id,
    record.properties?.keywords?.join(" "),
    record.properties?.description,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ");
}

export function findBestLayer(
  data: Float32Array,
  vectorSize: number,
  layers: readonly NaturalLanguageCatalogRecord[],
): LayerMatch | undefined {
  const [bestScore] = rankCandidateEmbeddings(
    data,
    vectorSize,
    layers.map(({ id }) => id),
    1,
  );
  const layer = layers.find(({ id }) => id === bestScore?.id);
  return layer && bestScore ? { layer, score: bestScore.score } : undefined;
}

export function rankCandidateEmbeddings(
  data: Float32Array,
  vectorSize: number,
  candidateIds: readonly string[],
  limit: number = 3,
): LayerScore[] {
  if (
    vectorSize <= 0 ||
    limit <= 0 ||
    data.length !== vectorSize * (candidateIds.length + 1)
  ) {
    return [];
  }

  return candidateIds
    .map((id, index): LayerScore => {
      let score = 0;
      const candidateOffset = (index + 1) * vectorSize;
      for (let dimension = 0; dimension < vectorSize; dimension += 1) {
        score += data[dimension]! * data[candidateOffset + dimension]!;
      }
      return { id, score };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}
