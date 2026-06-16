export function joinURL(base: string, ...segments: string[]) {
  const url = new URL(base);

  const list = [url.pathname, ...segments];
  const parts = list
    .map((s, idx) => {
      if (idx === list.length - 1) {
        // if it's the last element, we don't want to remove the trailing slash
        // if there is one!
        return s.replace(/^\/+/g, "");
      }
      return s.replace(/^\/+|\/+$/g, "");
    })
    .filter(Boolean);

  url.pathname = "/" + parts.join("/");

  return url.href;
}
