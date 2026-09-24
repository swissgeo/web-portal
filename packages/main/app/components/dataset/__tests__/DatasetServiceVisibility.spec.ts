import type { Distribution } from "@swissgeo/ogc";

import { mount, flushPromises } from "@vue/test-utils";
import { afterEach, expect, it, vi } from "vitest";
import { computed, reactive, toValue } from "vue";

import DatasetServiceList from "../DatasetServiceList.vue";

const states = reactive<
  Record<
    string,
    {
      address: string | null;
      isLoading: boolean;
      error: boolean;
    }
  >
>({});

vi.mock("~/composables/useDatasetService", () => ({
  useDatasetService: (distribution: () => Distribution) => ({
    address: computed(() => states[toValue(distribution).id]!.address),
    isLoading: computed(() => states[toValue(distribution).id]!.isLoading),
    error: computed(() => states[toValue(distribution).id]!.error),
  }),
}));

const wrappers: ReturnType<typeof mount>[] = [];
afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()));

function render() {
  states.wms = {
    address: "https://example.test/wms",
    isLoading: false,
    error: false,
  };
  states.stac = { address: null, isLoading: true, error: false };
  const distributions: Distribution[] = [
    {
      id: "wms",
      properties: { type: "Distribution", title: "Map", protocol: "ogc:wms" },
    },
    {
      id: "stac",
      properties: {
        type: "Distribution",
        title: "Download",
        protocol: "ogcapi:stac",
      },
    },
  ];
  const wrapper = mount(DatasetServiceList, {
    attachTo: document.body,
    props: { distributions },
    global: {
      mocks: { $t: (key: string) => key },
      stubs: {
        ClientOnly: { template: "<slot />" },
        DatasetCopyLink: true,
        UButton: { props: ["to"], template: '<a :href="to"><slot /></a>' },
      },
    },
  });
  wrappers.push(wrapper);
  return wrapper;
}

it("hides a completed empty download group and restores it when a link becomes available", async () => {
  const wrapper = render();
  const group = wrapper.findAll("section")[1]!;
  expect(group.isVisible()).toBe(true);
  expect(group.get('[role="status"]').text()).toBe("dataset.serviceLoading");

  states.stac!.isLoading = false;
  await flushPromises();
  expect(group.isVisible()).toBe(false);
  expect(group.get("li").isVisible()).toBe(false);
  expect(wrapper.findAll("section")[0]!.isVisible()).toBe(true);

  states.stac!.address = "https://example.test/browser";
  await flushPromises();
  const restoredGroup = wrapper.findAll("section")[1]!;
  expect(restoredGroup.isVisible()).toBe(true);
  expect(restoredGroup.get("a").attributes("href")).toBe(
    "https://example.test/browser",
  );
});

it("keeps failed requests visible and hides only empty rows in a mixed group", async () => {
  const wrapper = render();
  states.stac!.isLoading = false;
  states.stac!.error = true;
  states.empty = { address: null, isLoading: false, error: false };
  await wrapper.setProps({
    distributions: [
      ...wrapper.props("distributions"),
      {
        id: "empty",
        properties: {
          type: "Distribution",
          title: "Empty",
          protocol: "ogcapi:stac",
        },
      },
    ],
  });
  await flushPromises();
  const group = wrapper.findAll("section")[1]!;
  expect(group.isVisible()).toBe(true);
  expect(group.get('[role="status"]').text()).toBe("dataset.serviceError");
  expect(group.findAll("li").map((row) => row.isVisible())).toEqual([
    true,
    false,
  ]);
  expect(group.find("a").exists()).toBe(false);
});
