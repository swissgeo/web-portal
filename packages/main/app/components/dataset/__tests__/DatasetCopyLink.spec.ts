import { mount } from "@vue/test-utils";
import { expect, it, vi } from "vitest";
import { ref } from "vue";

import DatasetCopyLink from "../DatasetCopyLink.vue";

const { useClipboard } = vi.hoisted(() => ({ useClipboard: vi.fn() }));
vi.mock("@vueuse/core", () => ({ useClipboard }));

it("copies the current dataset URL and shows successful copy feedback", async () => {
  const copy = vi.fn();
  const copied = ref(false);
  useClipboard.mockReturnValue({ copy, copied });
  const wrapper = mount(DatasetCopyLink, {
    props: { url: "https://example.test/de/dataset/first" },
    global: {
      mocks: { $t: (key: string) => key },
      stubs: {
        UButton: { name: "UButton", props: ["icon"], template: "<button />" },
      },
    },
  });
  await wrapper.get("button").trigger("click");
  expect(copy).toHaveBeenLastCalledWith(
    "https://example.test/de/dataset/first",
  );

  await wrapper.setProps({ url: "https://example.test/fr/dataset/second" });
  await wrapper.get("button").trigger("click");
  expect(copy).toHaveBeenLastCalledWith(
    "https://example.test/fr/dataset/second",
  );

  copied.value = true;
  await wrapper.vm.$nextTick();
  expect(wrapper.getComponent({ name: "UButton" }).props("icon")).toBe(
    "i-lucide-copy-check",
  );
  expect(wrapper.get("button").classes()).toContain("text-success");
});
