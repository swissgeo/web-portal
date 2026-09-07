import { mount } from "@vue/test-utils";
import SidebarButton from "~/components/sidebar/SidebarButton.vue";
import { describe, expect, it } from "vitest";

describe("SidebarButton", () => {
  it("updates the active role and forwards one click", async () => {
    const wrapper = mount(SidebarButton, {
      props: { title: "Map", iconName: "Map", isActive: false },
      global: {
        stubs: {
          UButton: {
            name: "UButton",
            props: ["icon", "variant"],
            template: "<button><slot /></button>",
          },
        },
      },
    });
    const button = wrapper.getComponent({ name: "UButton" });

    expect(button.props("icon")).toBe("i-lucide-map");
    expect(button.props("variant")).toBe("ghost");
    expect(wrapper.get("button").attributes("title")).toBe("Map");
    await wrapper.setProps({ isActive: true });
    expect(button.props("variant")).toBe("solid");
    await wrapper.get("button").trigger("click");
    expect(wrapper.emitted("click")).toHaveLength(1);
  });
});
