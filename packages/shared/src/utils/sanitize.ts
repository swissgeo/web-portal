import type { Config } from "dompurify";

import DOMPurify from "dompurify";

/**
 * Sanitize HTML content to prevent XSS attacks.
 * Wraps DOMPurify with sensible defaults for the application.
 */
export function sanitizeHtml(dirty: string, config?: Config): string {
  return DOMPurify.sanitize(dirty, config);
}
