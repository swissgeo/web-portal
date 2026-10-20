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

  // Real OAR contact, ch.swisstopo.pixelkarte-farbe (dev, 2026-10-19).
  it("links phone, email and website, without the fax", () => {
    const wrapper = mount(DatasetContact, {
      props: {
        contact: {
          organization,
          roles: ["pointOfContact"],
          phones: [
            { value: "0041 58 469 04 59", roles: ["fax"] },
            { value: "0041 58 469 01 11", roles: ["work"] },
          ],
          emails: [{ value: "info@swisstopo.ch" }],
          links: [{ href: "https://www.swisstopo.ch" }],
        },
      },
      global: {
        stubs: {
          UIcon: true,
          ULink: { props: ["to"], template: "<a :href='to'><slot /></a>" },
        },
      },
    });

    expect(
      wrapper
        .findAll("a")
        .map((link) => [link.attributes("href"), link.text()]),
    ).toEqual([
      ["tel:0041584690111", "0041 58 469 01 11"],
      ["mailto:info@swisstopo.ch", "info@swisstopo.ch"],
      ["https://www.swisstopo.ch", "swisstopo.ch"],
    ]);
  });
});
