import type {
  LeadContentPageWithCheckbox,
  Link,
  List,
  Paragraph,
  TeaserContainer,
  TeaserItem,
  TitleComponent,
} from "@content/types";

import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { defineComponent } from "vue";

import LeadContentpageWithCheckbox from "../LeadContentpageWithCheckbox.global.vue";
import LinkElement from "../Link.global.vue";
import ListElement from "../List.global.vue";
import ListItemElement from "../ListItem.global.vue";
import ParagraphElement from "../P.global.vue";
import TeaserContainerElement from "../TeaserContainer.global.vue";
import TitleElement from "../Title.global.vue";

const title: TitleComponent = {
  component: "title",
  content: { title: "Geodata services" },
  id: "title-1",
  identifier: "title-1",
  position: "1",
};

const paragraph: Paragraph = {
  component: "p",
  content: { text: "Data&nbsp;for everyone" },
  id: "paragraph-1",
  identifier: "paragraph-1",
};

const teaserItems: TeaserItem[] = ["one", "two"].map((id) => ({
  component: "teaser-item",
  content: {
    teaser: {
      params: {
        teaser: {
          $ref: "document",
          reference: { id },
        },
      },
      service: "livingdocs",
    },
  },
  id,
  identifier: id,
}));

const ContentRendererStub = defineComponent({
  name: "ContentRenderer",
  props: {
    containers: {
      type: Array,
      required: true,
    },
  },
  template: '<div data-testid="content-renderer" />',
});

const TeaserItemStub = defineComponent({
  name: "ContentElementTeaserItem",
  props: {
    data: {
      type: Object,
      required: true,
    },
  },
  template: '<article data-testid="teaser-item" />',
});

const CarouselStub = defineComponent({
  name: "UCarousel",
  props: {
    items: {
      type: Array,
      required: true,
    },
  },
  emits: ["select"],
  template: `
    <div data-testid="carousel">
      <button data-testid="select-second" @click="$emit('select', 1)" />
      <slot v-for="item in items" :item="item" />
    </div>
  `,
});

const ProseAStub = defineComponent({
  name: "ProseA",
  inheritAttrs: false,
  props: {
    href: String,
    rel: String,
    target: String,
  },
  template: '<a :href="href" :rel="rel" :target="target"><slot /></a>',
});

const ProseLiStub = defineComponent({
  name: "ProseLi",
  template: "<li><slot /></li>",
});

const ProseUlStub = defineComponent({
  name: "ProseUl",
  template: "<ul><slot /></ul>",
});

const proseStubs = {
  ContentElementList: ListElement,
  ContentElementListItem: ListItemElement,
  ProseA: ProseAStub,
  ProseLi: ProseLiStub,
  ProseUl: ProseUlStub,
};

const makeTeaserContainer = (
  presentation: "teaser-carousel" | "teaser-grid",
): TeaserContainer => ({
  component: "teaser-container",
  containers: { teaserItems },
  content: { teaserTitle: "Maps" },
  id: presentation,
  identifier: presentation,
  styles: { pageCardPresentation: presentation },
});

describe("publication elements", () => {
  it("renders the publication lead with its title and paragraph data", () => {
    const data: LeadContentPageWithCheckbox = {
      component: "lead-contentpage-with-checkbox",
      containers: {
        "lead-contentpage-with-checkbox": [title, paragraph],
      },
      content: {
        publicationDateCheckbox: { service: "livingdocs" },
      },
      id: "lead-1",
      identifier: "lead-1",
    };

    const wrapper = mount(LeadContentpageWithCheckbox, {
      props: { data },
      global: { stubs: { ContentRenderer: ContentRendererStub } },
    });

    expect(wrapper.classes()).toContain("max-w-[1227px]");
    expect(
      wrapper.getComponent(ContentRendererStub).props("containers"),
    ).toEqual([title, paragraph]);
  });

  it("renders the shared title and paragraph typography", () => {
    const titleWrapper = mount(TitleElement, { props: { data: title } });
    const paragraphWrapper = mount(ParagraphElement, {
      props: { data: paragraph },
    });

    expect(titleWrapper.get("h1").classes()).toContain(
      "type-content-hero-title",
    );
    expect(titleWrapper.text()).toBe("Geodata services");
    expect(paragraphWrapper.text()).toBe("Data for everyone");
  });

  it("uses the CMS presentation style for carousel and grid containers", async () => {
    const global = {
      stubs: {
        ContentElementTeaserItem: TeaserItemStub,
        UCarousel: CarouselStub,
      },
    };
    const carousel = mount(TeaserContainerElement, {
      props: { data: makeTeaserContainer("teaser-carousel") },
      global,
    });
    const grid = mount(TeaserContainerElement, {
      props: { data: makeTeaserContainer("teaser-grid") },
      global,
    });

    expect(carousel.get('[data-testid="carousel"]')).toBeDefined();
    expect(carousel.text()).toContain("1/2");
    expect(carousel.findAll('[data-testid="teaser-item"]')).toHaveLength(2);

    await carousel.get('[data-testid="select-second"]').trigger("click");

    expect(carousel.text()).toContain("2/2");
    expect(grid.find('[data-testid="carousel"]').exists()).toBe(false);
    expect(grid.findAll('[data-testid="teaser-item"]')).toHaveLength(2);
  });

  it("renders rich nested lists without passing CMS HTML to v-html", () => {
    const nestedList: List = {
      component: "list",
      containers: {
        list: [
          {
            component: "list-item",
            content: { text: '<a href="https://example.com">Nested link</a>' },
            id: "nested-item",
            identifier: "nested-item",
          },
        ],
      },
      id: "nested-list",
      identifier: "nested-list",
    };
    const list: List = {
      component: "list",
      containers: {
        list: [
          {
            component: "list-item",
            content: { text: "<strong>Parent</strong><br>item" },
            id: "parent-item",
            identifier: "parent-item",
          },
          nestedList,
        ],
      },
      id: "list",
      identifier: "list",
    };

    const wrapper = mount(ListElement, {
      props: { data: list },
      global: { components: proseStubs },
    });

    expect(wrapper.findAll("ul")).toHaveLength(2);
    expect(wrapper.findAll("li")).toHaveLength(2);
    expect(wrapper.get("strong").text()).toBe("Parent");
    expect(wrapper.get("a").attributes()).toMatchObject({
      href: "https://example.com",
    });
    expect(wrapper.html()).not.toContain("v-html");
  });

  it("renders CMS links without changing the target and rejects unsafe URLs", () => {
    const link: Link = {
      component: "link",
      content: {
        link: { href: "https://example.com/maps" },
        text: "Open maps",
      },
      id: "link",
      identifier: "link",
    };
    const external = mount(LinkElement, {
      props: { data: link },
      global: { components: proseStubs },
    });
    const unsafe = mount(LinkElement, {
      props: {
        data: {
          ...link,
          content: { link: { href: "javascript:alert(1)" }, text: "Unsafe" },
        },
      },
      global: { components: proseStubs },
    });

    expect(external.get("a").attributes("href")).toBe(
      "https://example.com/maps",
    );
    expect(external.get("a").attributes("target")).toBeUndefined();
    expect(unsafe.find("a").exists()).toBe(false);
  });
});
