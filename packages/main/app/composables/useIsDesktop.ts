import { breakpointsTailwind, useBreakpoints } from "@vueuse/core";

/**
 * Whether we are in a viewport width that is considered "desktop". This is
 * for example used to decide between rendering UI in a sidebar or a bottom sheet.
 */
export function useIsDesktop() {
  return useBreakpoints(breakpointsTailwind).greaterOrEqual("md");
}
