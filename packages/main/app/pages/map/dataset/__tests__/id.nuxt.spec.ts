import type { Layer } from "@swissgeo/layers";

import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { useLayerStore } from "@swissgeo/layers";
import { SidebarType, useSidebarStore } from "@swissgeo/skeleton";
import DatasetPanel from "~/components/sidebar/DatasetPanel.vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

import DatasetPage from "../[id].vue";

mockNuxtImport("useDatasetRecord", () => () => ({
  dataset: ref({
    id: "example.dataset",
    properties: {
      type: "Dataset",
      title: "Example dataset",
      shortTitle: "Example",
      description: "Example description",
    },
  }),
  distributionCollection: ref(null),
  distributionError: ref(false),
  isLoading: ref(false),
  error: ref(null),
  promise: Promise.resolve(),
}));

// UTooltip needs UApp, which this spec does not mount.
const tooltipStub = { template: "<span><slot /></span>" };

// The drawer renders nothing on the server, so search engines only get what
// the page puts into the head. Keep the title and description coming from the
// dataset record.
describe("dataset page", () => {
  it("sets the page title and description from the dataset record", async () => {
    const wrapper = await mountSuspended(DatasetPage, {
      route: "/de/dataset/example.dataset",
      global: { stubs: { UTooltip: tooltipStub } },
    });

    await vi.waitFor(() => {
      expect(document.title).toBe("Example dataset");
    });
    expect(
      document
        .querySelector('meta[name="description"]')
        ?.getAttribute("content"),
    ).toBe("Example description");
    wrapper.unmount();
  });

  describe("back", () => {
    afterEach(() => {
      useSidebarStore().closeSidebar();
      useLayerStore().layers = [];
    });

    async function mountPanel() {
      const wrapper = await mountSuspended(DatasetPage, {
        route: "/de/dataset/example.dataset",
        global: { stubs: { UTooltip: tooltipStub } },
      });
      const panel = await vi.waitFor(() => wrapper.getComponent(DatasetPanel));
      return { wrapper, panel };
    }

    it.each`
      openPanel                      | isOnMap  | isBackToCatalog
      ${SidebarType.GEOCATALOG_TREE} | ${true}  | ${true}
      ${SidebarType.LAYER_CART}      | ${false} | ${false}
      ${null}                        | ${true}  | ${false}
      ${null}                        | ${false} | ${true}
    `(
      "goes back to the catalog=$isBackToCatalog with panel $openPanel and dataset on map=$isOnMap",
      async ({ openPanel, isOnMap, isBackToCatalog }) => {
        if (openPanel) {
          useSidebarStore().setSidebar(openPanel);
        }
        if (isOnMap) {
          useLayerStore().layers = [{ humanId: "example.dataset" } as Layer];
        }

        const { wrapper, panel } = await mountPanel();

        expect(panel.props("backToCatalog")).toBe(isBackToCatalog);
        wrapper.unmount();
      },
    );

    it("opens the catalog when a direct link goes back to it", async () => {
      const { wrapper, panel } = await mountPanel();

      panel.vm.$emit("back");

      expect(useSidebarStore().currentSidebar).toBe(
        SidebarType.GEOCATALOG_TREE,
      );
      wrapper.unmount();
    });

    it.each`
      openPanel                      | panelAfterClose
      ${SidebarType.GEOCATALOG_TREE} | ${SidebarType.LAYER_CART}
      ${SidebarType.LAYER_CART}      | ${SidebarType.LAYER_CART}
      ${null}                        | ${null}
    `(
      "closes to the map with panel $panelAfterClose when panel $openPanel was open",
      async ({ openPanel, panelAfterClose }) => {
        if (openPanel) {
          useSidebarStore().setSidebar(openPanel);
        }
        const { wrapper, panel } = await mountPanel();

        panel.vm.$emit("close");

        expect(useSidebarStore().currentSidebar).toBe(panelAfterClose);
        wrapper.unmount();
      },
    );

    it("keeps the cart when going back to the map", async () => {
      useSidebarStore().setSidebar(SidebarType.LAYER_CART);
      const { wrapper, panel } = await mountPanel();

      panel.vm.$emit("back");

      expect(useSidebarStore().currentSidebar).toBe(SidebarType.LAYER_CART);
      wrapper.unmount();
    });
  });
});
