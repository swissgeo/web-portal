import DOMPurify from "dompurify";

/**
 * Sanitize XML content (KML, GPX) to prevent XML-based attacks.
 * Preserves SVG elements used in KML styling while stripping dangerous content.
 */
export function sanitizeXml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    USE_PROFILES: { svg: true },
  });
}
