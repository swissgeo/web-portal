import { mount } from "@vue/test-utils";
import { useToolboxStore } from "~/stores/toolbox";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ImportButton from "@/components/toolbox/toolboxButtons/ImportButton.vue";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

describe("ImportButton.vue", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  function mountButton() {
    return mount(ImportButton, {
      shallow: true,
      global: {
        stubs: {
          ToolBoxButton: {
            template:
              '<button :disabled="isDisabled" @click="$emit(\'click\')"><span class="title">{{ title }}</span><span class="active">{{ isActive }}</span></button>',
            props: ["title", "isActive", "isDisabled", "iconName"],
            emits: ["click"],
          },
        },
      },
    });
  }

  it("renders with the correct title", () => {
    const wrapper = mountButton();
    expect(wrapper.find(".title").text()).toBe("toolbox.import.buttonTitle");
  });

  it("is not active when import panel is closed", () => {
    const wrapper = mountButton();
    expect(wrapper.find(".active").text()).toBe("false");
  });

  it("is active when import panel is open", () => {
    const toolboxStore = useToolboxStore();
    toolboxStore.toggleDetailPanel("import");

    const wrapper = mountButton();
    expect(wrapper.find(".active").text()).toBe("true");
  });

  it("calls toggleDetailPanel on click", async () => {
    const toolboxStore = useToolboxStore();
    const toggleSpy = vi.spyOn(toolboxStore, "toggleDetailPanel");

    const wrapper = mountButton();
    await wrapper
      .find('[data-testid="toolbox-import-button"]')
      .trigger("click");

    expect(toggleSpy).toHaveBeenCalledWith("import");
  });
});
