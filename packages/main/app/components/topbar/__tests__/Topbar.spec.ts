import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import Topbar from "~/components/topbar/Topbar.vue";
import { describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";

const messages: Record<string, string> = {
  "topbar.home": "Startseite",
  "topbar.map": "Karte",
  "topbar.services": "Services",
  "topbar.fundamentalsAndStandards": "Grundlagen & Standards",
  "topbar.aboutUs": "Über uns",
  "topbar.login": "Anmelden",
  "topbar.modeSwitch": "Mode switch",
};

mockNuxtImport("useI18n", () => {
  return () => ({
    t: (key: string) => messages[key] ?? key,
  });
});

mockNuxtImport("useLocalePath", () => {
  return () => (path: string) => `/de${path}`;
});

vi.mock("@swissgeo/skeleton", () => ({
  LogoPic: {
    name: "LogoPic",
    emits: ["logo-click"],
    template:
      '<button data-testid="topbar-logo" @click="$emit(\'logo-click\')" />',
  },
}));

const UHeaderStub = defineComponent({
  name: "UHeader",
  template: `
    <header>
      <slot name="left" />
      <slot />
      <slot name="right" />
      <slot name="body" />
    </header>
  `,
});

const UNavigationMenuStub = defineComponent({
  name: "UNavigationMenu",
  props: {
    items: {
      type: Array,
      required: true,
    },
  },
  template: '<nav data-testid="navigation-menu" />',
});

const TopbarSearchStub = defineComponent({
  name: "TopbarSearch",
  emits: ["result-selected"],
  template: `
    <button
      data-testid="search"
      @click="$emit('result-selected', { id: 'result' })"
    >
      Search
    </button>
  `,
});

const TopbarLanguageSwitcherButtonStub = defineComponent({
  name: "TopbarLanguageSwitcherButton",
  template: '<button data-testid="locale">DE</button>',
});

const TopbarColorModeButtonStub = defineComponent({
  name: "TopbarColorModeButton",
  template: '<button data-testid="mode-switch">Mode switch</button>',
});

function mountComponent() {
  return mount(Topbar, {
    global: {
      stubs: {
        UHeader: UHeaderStub,
        UNavigationMenu: UNavigationMenuStub,
        UButton: true,
        TopbarSearch: TopbarSearchStub,
        TopbarLanguageSwitcherButton: TopbarLanguageSwitcherButtonStub,
        TopbarColorModeButton: TopbarColorModeButtonStub,
      },
    },
  });
}

describe("Topbar", () => {
  it("uses the Figma navigation labels and the localized map route", () => {
    const wrapper = mountComponent();
    const menus = wrapper.findAllComponents(UNavigationMenuStub);
    const items = menus[0]!.props("items") as Array<{
      label: string;
      to?: string;
      ui?: { link?: string };
    }>;

    expect(items.map((item) => item.label)).toEqual([
      "Startseite",
      "Karte",
      "Services",
      "Grundlagen & Standards",
      "Über uns",
    ]);
    expect(items[1]).toMatchObject({
      to: "/de/map",
      ui: {
        link: expect.stringContaining(
          "aria-[current=page]:before:bg-primary/10",
        ),
      },
    });
  });

  it("emits reset-app when the user activates the logo", async () => {
    const wrapper = mountComponent();

    await wrapper.get('[data-testid="topbar-logo"]').trigger("click");

    expect(wrapper.emitted("reset-app")).toHaveLength(1);
  });

  it("forwards search selections", async () => {
    const wrapper = mountComponent();

    await wrapper.get('[data-testid="search"]').trigger("click");

    expect(wrapper.emitted("search-result-selected")).toEqual([
      [{ id: "result" }],
    ]);
  });

  it("keeps the locale control in desktop and mobile compositions", () => {
    const wrapper = mountComponent();

    expect(wrapper.findAll('[data-testid="locale"]')).toHaveLength(2);
  });

  it("keeps the color-mode control in desktop and mobile compositions", () => {
    const wrapper = mountComponent();

    expect(wrapper.findAll('[data-testid="mode-switch"]')).toHaveLength(2);
  });
});
