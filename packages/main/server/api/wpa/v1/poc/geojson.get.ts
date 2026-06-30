/**
 * POC (GPS-732) dev-only proxy. The debug GeoJSON picker fetches a layer's data
 * and literals style from the public geoadmin endpoints; doing that from the
 * browser is blocked by CORS, so we proxy same-origin through Nitro. Restricted
 * to the geoadmin hosts to avoid an open proxy.
 */
const ALLOWED_PREFIXES = [
  "https://data.geo.admin.ch/",
  "https://api3.geo.admin.ch/",
];

export default defineEventHandler(async (event) => {
  const url = getQuery(event).url;
  if (
    typeof url !== "string" ||
    !ALLOWED_PREFIXES.some((prefix) => url.startsWith(prefix))
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing or disallowed url query parameter",
    });
  }
  // Some geoadmin data files are served as `binary/octet-stream` rather than
  // `application/json`. Without forcing the response type, ofetch would hand back
  // a Blob for those (instead of parsed JSON), which the browser then can't read
  // as a FeatureCollection. Both the style and data endpoints return JSON, so
  // parse it as JSON regardless of the upstream content-type.
  return await $fetch(url, { responseType: "json" });
});
