// Default Cache-Control for responses that do not set one themselves:
//
// - GET / HEAD responses are cacheable for 5 minutes. Keep max-age short:
//   SSR HTML embeds the per-build asset dir (/_nxt/<uuid>/) whose files no
//   longer exist after a redeploy.
// - All other methods are not cacheable.
//
// Routes that need a different value (health, redirects, error
// responses, external-layer proxies) set their own header afterwards,
// overwriting this default.

import { getMethod, getResponseHeader, setResponseHeader } from "h3";

const CACHEABLE = "public, max-age=300";
const NOT_CACHEABLE = "no-store";

export default defineEventHandler((event) => {
  if (getResponseHeader(event, "Cache-Control")) {
    return;
  }
  const method = getMethod(event);
  if (method === "GET" || method === "HEAD") {
    setResponseHeader(event, "Cache-Control", CACHEABLE);
  } else {
    setResponseHeader(event, "Cache-Control", NOT_CACHEABLE);
  }
});
