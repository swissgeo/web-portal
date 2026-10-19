import { mount } from "@vue/test-utils";
import { expect, it, vi } from "vitest";
import { ref } from "vue";

import DatasetCopyLink from "../DatasetCopyLink.vue";

vi.mock("vue-i18n", () => ({ useI18n: () => ({ t: (key: string) => key }) }));

const { useClipboard } = vi.hoisted(() => ({ useClipboard: vi.fn() }));
vi.mock("@vueuse/core", () => ({ useClipboard }));

it("copies the current dataset URL and shows successful copy feedback", async () => {
  const copy = vi.fn();
  const copied = ref(false);
  useClipboard.mockReturnValue({ copy, copied });
  const wrapper = mount(DatasetCopyLink, {
    props: { url: "https://example.test/de/dataset/first", label: "Copy" },
    attrs: { class: "-ml-8", "data-testid": "dataset-service-copy" },
    global: {
      stubs: {
        UButton: { name: "UButton", props: ["icon"], template: "<button />" },
        UTooltip: {
          props: ["text"],
          template: '<span :data-tooltip="text"><slot /></span>',
        },
      },
    },
  });
  expect(wrapper.get("[data-tooltip]").attributes("data-tooltip")).toBe("Copy");
  expect(wrapper.get("button").attributes("aria-label")).toBe("Copy");
  expect(wrapper.get("button").classes()).toContain("-ml-8");
  expect(wrapper.get("button").attributes("data-testid")).toBe(
    "dataset-service-copy",
  );

  await wrapper.get("button").trigger("click");
  expect(copy).toHaveBeenLastCalledWith(
    "https://example.test/de/dataset/first",
  );

  await wrapper.setProps({ url: "https://example.test/fr/dataset/second" });
  await wrapper.get("button").trigger("click");
  expect(copy).toHaveBeenLastCalledWith(
    "https://example.test/fr/dataset/second",
  );

  await wrapper.setProps({ defaultIcon: "i-lucide-copy" });
  expect(wrapper.getComponent({ name: "UButton" }).props("icon")).toBe(
    "i-lucide-copy",
  );

  copied.value = true;
  await wrapper.vm.$nextTick();
  expect(wrapper.getComponent({ name: "UButton" }).props("icon")).toBe(
    "i-lucide-copy-check",
  );
  expect(wrapper.get("button").classes()).toContain("text-success");
});
