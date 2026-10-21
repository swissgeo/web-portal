import { setResponseHeader } from "h3";

// Error responses (thrown errors and showError from error.vue) must never be cached.
export default defineNitroPlugin((app) => {
  app.hooks.hook("error", (_error, { event }) => {
    if (event) {
      setResponseHeader(event, "Cache-Control", "no-store");
    }
  });
});
