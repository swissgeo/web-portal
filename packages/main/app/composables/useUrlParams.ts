import log, { LogPreDefinedColor } from "@swissgeo/log";
import { fetchStateFromStateId } from "~/utils/fetchStateFromStateId";

import type { PrintConfig } from "../types/print";

// URL param providing the ID to a state on service-portal-state
export const URL_PARAM_STATE = "state";

// URL param related to print config
const URL_PARAM_PRINT_FORMAT = "print_format";
const URL_PARAM_PRINT_ORIENTATION = "print_orientation";
const URL_PARAM_PRINT_RESOLUTION = "print_resolution";

export function useUrlParams() {
  const route = useRoute();
  const router = useRouter();

  function dropStateParam(paramName: typeof URL_PARAM_STATE) {
    // remove the state ID from the URL (without page refresh)
    onNuxtReady(async () => {
      const newQuery = { ...route.query };
      delete newQuery[paramName];
      await router.replace({ query: newQuery });
    });
  }

  /**
   * Get the state ID from URL, or null is missing
   */
  function getStateIdFromUrl(): string | null {
    const stateParam = route.query[URL_PARAM_STATE];

    if (!stateParam) {
      return null;
    }

    dropStateParam(URL_PARAM_STATE);

    // Extract the value, handling the case where multiple params with the same name exist
    const stateId = Array.isArray(stateParam) ? stateParam[0] : stateParam;

    if (typeof stateId !== "string") {
      return null;
    }

    log.debug({
      title: "useUrlParam",
      titleColor: LogPreDefinedColor.Sky,
      messages: [
        "State found in the URL param, using this to fetch the state from the service",
        stateId,
      ],
    });

    return stateId;
  }

  /**
   * Read the state ID from URL param, load the state corresponding to this ID,
   * return it as a payload and removed the param from the URL
   */
  async function getStateFromUrl(): Promise<{
    state: unknown;
    stateId: string | null;
  }> {
    const stateId = getStateIdFromUrl();
    if (!stateId) {
      return Promise.resolve({
        state: null,
        stateId: null,
      });
    }

    let state: Record<string, unknown> | null = null;

    try {
      state = JSON.parse(atob(stateId));
    } catch {
      state = await fetchStateFromStateId(stateId);
    }

    return {
      state,
      stateId,
    };
  }

  /**
   * Get the print config from the URL
   * ?print_format=a4&print_orientation=landscape&print_resolution=96&z=8
   */
  function getPrintConfigFromUrl(): PrintConfig {
    const printConfig = {
      format: route.query[URL_PARAM_PRINT_FORMAT],
      orientation: route.query[URL_PARAM_PRINT_ORIENTATION],
      resolution: Number.parseFloat(
        route.query[URL_PARAM_PRINT_RESOLUTION] as string,
      ),
    };

    validatePrintConfig(printConfig);
    return printConfig;
  }

  return {
    getStateFromUrl,
    getStateIdFromUrl,
    getPrintConfigFromUrl,
  };
}
