/**
 * Encodes a capabilities URL so it can be carried as a single path segment by
 * the debug "import external layers" routes.
 *
 * `encodeURIComponent` leaves `%2F` in the path, which many reverse proxies
 * reject with 400 (path-traversal protection). base64url contains only
 * `A-Za-z0-9-_`, so it survives as a path segment. Must round-trip with the
 * server routes' `Buffer.from(param, "base64url")`.
 */
export function encodeCapabilityUrl(url: string): string {
  const bytes = new TextEncoder().encode(url);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
