import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { defineComponent, onMounted } from "vue";

import LayerLoadErrorBoundary from "../LayerLoadErrorBoundary.vue";

describe("LayerLoadErrorBoundary", () => {
  it("emits the converter error and removes the failed subtree", async () => {
    const error = new Error("conversion failed");
    const FailingConverter = defineComponent({
      setup() {
        onMounted(() => {
          throw error;
        });
      },
      template: "<div>converter</div>",
    });

    const wrapper = mount(LayerLoadErrorBoundary, {
      slots: { default: FailingConverter },
    });

    expect(wrapper.emitted("error")).toEqual([[error]]);
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toBe("");
  });
});
