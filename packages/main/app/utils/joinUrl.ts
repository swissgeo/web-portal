export function joinURL(base: string, ...segments: string[]) {
  const url = new URL(base);
  const parts = [url.pathname, ...segments]
    .map((s) => s.replace(/^\/+|\/+$/g, ""))
    .filter(Boolean);
  url.pathname = "/" + parts.join("/");
  return url.href;
}
