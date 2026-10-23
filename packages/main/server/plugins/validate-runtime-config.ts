// The image has no default backend URLs. Each staging must set them as
// environment variables. The server must not start when a value is missing,
// so that a deployment with an incomplete configuration fails and the
// blue-green rollout keeps the previous version.

const REQUIRED_SERVER_URL_KEYS = [
  "geoadminApiBaseUrl",
  "reportIssueServiceUrl",
  "livingdocsApiEndpoint",
] as const;

const REQUIRED_PUBLIC_URL_KEYS = [
  "ogcApiEndpoint",
  "cmsBaseUrl",
  "iconServiceEndpoint",
  "drawingServiceEndpoint",
  "shareServiceUrl",
  "searchServiceUrl",
  "thesaurusServiceUrl",
  "printServiceUrl",
] as const;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function isDomainList(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString)
  );
}

// Nuxt maps "public.iconServiceEndpoint" to NUXT_PUBLIC_ICON_SERVICE_ENDPOINT.
function toEnvName(key: string, isPublic: boolean): string {
  const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter}`);
  return `NUXT_${isPublic ? "PUBLIC_" : ""}${snakeKey.toUpperCase()}`;
}

export default defineNitroPlugin(() => {
  const config = useRuntimeConfig();

  const missingEnvNames = [
    ...REQUIRED_SERVER_URL_KEYS.filter(
      (key) => !isNonEmptyString(config[key]),
    ).map((key) => toEnvName(key, false)),
    ...REQUIRED_PUBLIC_URL_KEYS.filter(
      (key) => !isNonEmptyString(config.public[key]),
    ).map((key) => toEnvName(key, true)),
  ];
  if (!isDomainList(config.public.drawingAllowedDomains)) {
    missingEnvNames.push(toEnvName("drawingAllowedDomains", true));
  }

  if (missingEnvNames.length > 0) {
    throw new Error(
      `Missing runtime configuration, set these environment variables: ${missingEnvNames.join(", ")}`,
    );
  }
});
