/**
 * Decodes a capabilities URL that the client base64url-encoded to carry it as a
 * single path segment (see app/utils/externalLayerUrl.ts). base64url survives
 * reverse proxies that reject the `%2F` left by `encodeURIComponent`.
 */
export function decodeCapabilityUrl(param: string): string {
  return Buffer.from(param, "base64url").toString("utf-8");
}
