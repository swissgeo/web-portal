import { mount } from "@vue/test-utils";
import { useToolboxStore } from "~/stores/toolbox";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ReportIssueButton from "@/components/toolbox/toolboxButtons/ReportIssueButton.vue";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

describe("ReportIssueButton.vue", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  function mountButton() {
    return mount(ReportIssueButton, {
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
    expect(wrapper.find(".title").text()).toBe(
      "toolbox.reportIssue.buttonTitle",
    );
  });

  it("is not active when report issue panel is closed", () => {
    const wrapper = mountButton();
    expect(wrapper.find(".active").text()).toBe("false");
  });

  it("is active when report issue panel is open", () => {
    const toolboxStore = useToolboxStore();
    toolboxStore.toggleDetailPanel("reportIssue");

    const wrapper = mountButton();
    expect(wrapper.find(".active").text()).toBe("true");
  });

  it("calls toggleDetailPanel on click", async () => {
    const toolboxStore = useToolboxStore();
    const toggleSpy = vi.spyOn(toolboxStore, "toggleDetailPanel");

    const wrapper = mountButton();
    await wrapper
      .find('[data-testid="toolbox-report-issue-button"]')
      .trigger("click");

    expect(toggleSpy).toHaveBeenCalledWith("reportIssue");
  });
});
