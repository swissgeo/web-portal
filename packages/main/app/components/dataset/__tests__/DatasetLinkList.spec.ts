import { mount } from "@vue/test-utils";
import { expect, it } from "vitest";

import DatasetLinkList from "../DatasetLinkList.vue";

it("uses the display label without changing the supplied metadata URL", () => {
  const href =
    "https://www.geocat.ch/geonetwork/srv/ger/catalog.search#/metadata/example";
  const wrapper = mount(DatasetLinkList, {
    props: {
      links: [{ href, rel: "alternate", title: "Original title" }],
      label: "Auf geocat.ch ansehen",
    },
    global: {
      stubs: {
        ULink: { props: ["to"], template: '<a :href="to"><slot /></a>' },
        UIcon: true,
      },
    },
  });
  expect(wrapper.get("a").attributes("href")).toBe(href);
  expect(wrapper.get("a").attributes("target")).toBe("_blank");
  expect(wrapper.get("a").text()).toBe("Auf geocat.ch ansehen");
});
