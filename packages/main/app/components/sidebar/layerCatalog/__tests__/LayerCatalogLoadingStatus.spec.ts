import type { AsyncDataRequestStatus } from "#app";

import { mount } from "@vue/test-utils";
import LayerCatalogLoadingStatus from "~/components/sidebar/layerCatalog/LayerCatalogLoadingStatus.vue";
import { describe, expect, it, vi } from "vitest";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

function mountStatus(status: AsyncDataRequestStatus) {
  return mount(LayerCatalogLoadingStatus, {
    props: { status },
    slots: { default: "<span data-testid='content'>Content</span>" },
  });
}

describe("LayerCatalogLoadingStatus.vue", () => {
  it("shows the content once loaded", () => {
    const wrapper = mountStatus("success");

    expect(wrapper.text()).toBe("Content");
  });

  it.each<AsyncDataRequestStatus>(["idle", "pending"])(
    "shows the loading message instead of the content while the status is %s",
    (status) => {
      const wrapper = mountStatus(status);

      expect(wrapper.text()).toBe("layerCatalog.loading");
      expect(wrapper.find("[data-testid='content']").exists()).toBe(false);
    },
  );

  it("shows the error message instead of the content when loading failed", () => {
    const wrapper = mountStatus("error");

    expect(wrapper.text()).toBe("layerCatalog.error");
    expect(wrapper.find("[data-testid='content']").exists()).toBe(false);
  });
});
