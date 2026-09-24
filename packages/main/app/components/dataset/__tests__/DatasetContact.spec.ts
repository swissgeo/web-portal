import type { Contact } from "@swissgeo/ogc";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import DatasetContact from "../DatasetContact.vue";

mockNuxtImport("useAppConfig", () => () => ({ ui: {} }));

const organization = "Federal Office of Topography";

describe("DatasetContact", () => {
  it.each<{ contact: Contact; description: string | null }>([
    { contact: { organization }, description: null },
    {
      contact: { organization, role: "owner" },
      description: null,
    },
    {
      contact: { organization, country: "CH" },
      description: "CH",
    },
    {
      contact: { organization, role: "owner", country: "CH" },
      description: "CH",
    },
  ])(
    "shows organization and country without the technical role: $description",
    ({ contact, description }) => {
      const wrapper = mount(DatasetContact, { props: { contact } });

      expect(wrapper.get("p").text()).toBe(organization);
      expect(wrapper.findAll("p").map((paragraph) => paragraph.text())).toEqual(
        description ? [organization, description] : [organization],
      );
      expect(wrapper.find("img").exists()).toBe(false);
      expect(wrapper.find("a").exists()).toBe(false);
    },
  );

  it("updates when a different contact is supplied", async () => {
    const wrapper = mount(DatasetContact, {
      props: { contact: { organization, role: "owner" } },
    });

    await wrapper.setProps({ contact: { organization: "Another office" } });

    expect(wrapper.text()).toBe("Another office");
  });
});
