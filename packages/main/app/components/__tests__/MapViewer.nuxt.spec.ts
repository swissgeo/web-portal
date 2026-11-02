import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MapViewer from "../MapViewer.vue";

const { environmentMock } = vi.hoisted(() => ({
  environmentMock: {
    environment: "prod",
    isDebugToolsEnabled: false,
    isTestSite: false,
    isLocalDev: false,
    isProduction: true,
  },
}));

mockNuxtImport("useEnvironment", () => () => environmentMock);

// BaseMapViewer renders the OpenLayers map; stub it so only the slot
// contents — among them the conditional DebugPanel — are mounted.
const stubs = {
  BaseMapViewer: {
    name: "BaseMapViewer",
    template: `<div><slot name="context-menu-popup" /><slot name="map-ui" /><slot name="after" /></div>`,
  },
  DebugPanel: {
    name: "DebugPanel",
    template: '<div data-testid="debug-panel" />',
  },
  MapContextMenuPopup: true,
  MapAttributionList: true,
  MapTimeSliderButton: true,
  LazyMapElevationWindow: true,
};

describe("MapViewer.vue", () => {
  beforeEach(() => {
    environmentMock.environment = "prod";
    environmentMock.isDebugToolsEnabled = false;
  });

  it.each([
    { environment: "local", visible: true },
    { environment: "dev", visible: true },
    { environment: "preview", visible: true },
    { environment: "int", visible: false },
    { environment: "prod", visible: false },
  ])(
    "debug toolbar is $visible in $environment",
    async ({ environment, visible }) => {
      environmentMock.environment = environment;
      environmentMock.isDebugToolsEnabled = visible;

      const wrapper = await mountSuspended(MapViewer, { global: { stubs } });

      expect(wrapper.find('[data-testid="debug-panel"]').exists()).toBe(
        visible,
      );
    },
  );
});
