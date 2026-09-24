import type { Distribution } from "@swissgeo/ogc";

import { mount } from "@vue/test-utils";
import { expect, it } from "vitest";

import DatasetService from "../DatasetService.vue";
import DatasetServiceList from "../DatasetServiceList.vue";

it("groups downloads separately and removes empty groups when data changes", async () => {
  const protocols: NonNullable<Distribution["properties"]["protocol"]>[] = [
    "ogc:wms",
    "ogc:wmts",
    "ogcapi:stac",
  ];
  const distributions: Distribution[] = protocols.map((protocol) => ({
    id: protocol,
    properties: { type: "Distribution", title: protocol, protocol },
  }));
  const wrapper = mount(DatasetServiceList, {
    props: { distributions },
    global: {
      mocks: { $t: (key: string) => key },
      stubs: { DatasetService: true },
    },
  });
  const sections = wrapper.findAll("section");
  expect(sections.map((section) => section.get("h4").text())).toEqual([
    "dataset.mapServices",
    "dataset.otherAccess",
  ]);
  expect(sections[0]!.findAllComponents(DatasetService)).toHaveLength(2);
  expect(
    wrapper
      .findAllComponents(DatasetService)
      .map((row) => row.props("distribution")),
  ).toEqual(distributions);
  expect(
    sections[1]!.getComponent(DatasetService).props("distribution"),
  ).toEqual(distributions[2]);

  await wrapper.setProps({ distributions: distributions.slice(2) });
  expect(wrapper.findAll("section")).toHaveLength(1);
  expect(wrapper.get("h4").text()).toBe("dataset.otherAccess");

  await wrapper.setProps({ distributions: [] });
  expect(wrapper.find("section").exists()).toBe(false);
});
