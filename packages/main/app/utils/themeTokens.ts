/**
 *
 * Reads a CSS custom property from the document root at runtime.
 *
 * This needs a rendered document, so this should be called only on the client side
 * (inside <ClientOnly> trees)
 *
 * @param token the custom property name, including the leading `--`
 * @param fallback returned when the token is empty or unavailable — every
 *   caller should pass one so a missing token can never produce an unstyled
 *   element
 * @returns the resolved value (trimmed), or the fallback
 */
export function readThemeToken(token: string, fallback: string): string {
  if (typeof document === "undefined") {
    return fallback;
  }
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(token)
    .trim();
  return value || fallback;
}
