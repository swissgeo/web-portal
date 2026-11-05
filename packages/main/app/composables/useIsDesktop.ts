import { breakpointsTailwind, useBreakpoints } from "@vueuse/core";
import { computed, shallowRef } from "vue";

/**
 * Whether we are in a viewport width that is considered "desktop". This is
 * for example used to decide between rendering UI in a sidebar or a bottom sheet.
 */
export function useIsDesktop() {
  const isWide = useBreakpoints(breakpointsTailwind).greaterOrEqual("md");
  // The server does not know the viewport width and renders the mobile layout.
  // The client must render the same layout until hydration ends, or Vue logs
  // a hydration mismatch.
  const nuxtApp = useNuxtApp();
  const isHydrated = shallowRef(!nuxtApp.isHydrating);
  if (!isHydrated.value) {
    nuxtApp.hooks.hookOnce("app:suspense:resolve", () => {
      isHydrated.value = true;
    });
  }
  return computed(() => isHydrated.value && isWide.value);
}
