import type {
  LeadContentPageWithCheckbox,
  Paragraph,
  TeaserContainer,
  TeaserItem,
  TitleComponent,
} from "@content/types";

import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { defineComponent } from "vue";

import LeadContentpageWithCheckbox from "../LeadContentpageWithCheckbox.global.vue";
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
});
