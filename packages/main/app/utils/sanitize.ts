import type { Config } from "dompurify";

import log from "@swissgeo/log";
import DOMPurify from "dompurify";

const BLOCKED_EXTENSIONS = [
  "exe",
  "bat",
  "cmd",
  "sh",
  "msi",
  "scr",
  "vbs",
  "dll",
];

const SANITIZE_CONFIG: Config = {
  ALLOWED_URI_REGEXP: /^(https?|mailto|tel|sms):/i,
};

let blockedContentMessage = "";

// We register this hook once, and it will apply to each call in this file.
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (!(node instanceof Element) || node.tagName !== "A") {
    return;
  }
  node.setAttribute("target", "_blank");
  node.setAttribute("rel", "noopener noreferrer");
  if (!node.hasAttribute("href")) {
    return;
  }
  try {
    const url = new URL(node.getAttribute("href") ?? "");
    const extension = (url.pathname.split(".").pop() ?? "").toLowerCase();
    if (BLOCKED_EXTENSIONS.includes(extension)) {
      node.outerHTML = blockedContentMessage;
    }
  } catch (error) {
    // Fail-closed: malformed URI will land here
    log.error("Error while handling node for sanitizing HTML", error);
    node.outerHTML = blockedContentMessage;
  }
});

/** This is called when we retrieve an html popup from a non-trusted source (external WMS for example, or the description key in a public kml) */
export function sanitizeHtml(html: string, message: string): string {
  blockedContentMessage = message;
  return DOMPurify.sanitize(html, SANITIZE_CONFIG);
}
