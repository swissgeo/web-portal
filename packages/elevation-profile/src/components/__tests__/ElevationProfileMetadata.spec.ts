import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import type { ElevationProfileMetadata } from "@/types";

import ElevationProfileMetadataComponent from "@/components/ElevationProfileMetadata.vue";

const defaultMetadata: ElevationProfileMetadata = {
  totalLinearDist: 5000,
  minElevation: 400,
  maxElevation: 1200,
  elevationDifference: 800,
  totalAscent: 900,
  totalDescent: 100,
  slopeDistance: 5200,
  hasElevationData: true,
  hasDistanceData: true,
  dataModel: "swissALTI3D",
};

const defaultLabels = {
  elevationDifference: "Elevation difference",
  elevationUp: "Ascent",
  elevationDown: "Descent",
  poiUp: "Highest point",
  poiDown: "Lowest point",
  distance: "Distance",
  slopeDistance: "Slope distance",
};

function mountComponent(
  metadataOverrides: Partial<ElevationProfileMetadata> = {},
  slotContent = "<span>slot content</span>",
) {
  return mount(ElevationProfileMetadataComponent, {
    props: {
      metadata: { ...defaultMetadata, ...metadataOverrides },
      labels: defaultLabels,
    },
    slots: { default: slotContent },
    global: {
      stubs: {
        UTooltip: {
          props: ["text"],
          template: '<div :data-tooltip="text"><slot /></div>',
        },
        UIcon: {
          props: ["name"],
          template: '<span :data-icon="name" />',
        },
      },
    },
  });
}

describe("ElevationProfileMetadata", () => {
  describe("metadataEntries computed", () => {
    it("renders metadata entries when hasElevationData is true", () => {
      const wrapper = mountComponent();
      const container = wrapper.find(
        '[data-testid="profile-popup-info-container"]',
      );
      expect(container.exists()).toBe(true);
      const entries = container.findAll("small");
      expect(entries).toHaveLength(7);
    });

    it("formats elevationDifference with formatElevation", () => {
      const wrapper = mountComponent();
      expect(wrapper.text()).toContain("800.00m");
    });

    it("formats totalAscent with formatElevation", () => {
      const wrapper = mountComponent();
      expect(wrapper.text()).toContain("900.00m");
    });

    it("formats totalDescent with formatElevation", () => {
      const wrapper = mountComponent();
      expect(wrapper.text()).toContain("100.00m");
    });

    it("formats maxElevation with formatElevation", () => {
      const wrapper = mountComponent();
      expect(wrapper.text()).toContain("1'200m");
    });

    it("formats minElevation with formatElevation", () => {
      const wrapper = mountComponent();
      expect(wrapper.text()).toContain("400.00m");
    });

    it("formats totalLinearDist with formatDistance", () => {
      const wrapper = mountComponent();
      expect(wrapper.text()).toContain("5.00km");
    });

    it("formats slopeDistance with formatDistance", () => {
      const wrapper = mountComponent();
      expect(wrapper.text()).toContain("5.20km");
    });
  });

  describe("conditional rendering", () => {
    it("renders metadata container when hasElevationData is true", () => {
      const wrapper = mountComponent({ hasElevationData: true });
      expect(
        wrapper.find('[data-testid="profile-popup-info-container"]').exists(),
      ).toBe(true);
    });

    it("hides metadata container when hasElevationData is false", () => {
      const wrapper = mountComponent({ hasElevationData: false });
      expect(
        wrapper.find('[data-testid="profile-popup-info-container"]').exists(),
      ).toBe(false);
    });
  });

  describe("template rendering", () => {
    it("displays formatted values in the template", () => {
      const wrapper = mountComponent();
      const infoSpans = wrapper.findAll('[data-testid="profile-popup-info"]');
      expect(infoSpans.length).toBe(7);
      expect(infoSpans[0].text()).toBe("800.00m");
      expect(infoSpans[1].text()).toBe("900.00m");
      expect(infoSpans[2].text()).toBe("100.00m");
    });

    it("passes correct tooltip text to each entry", () => {
      const wrapper = mountComponent();
      const tooltips = wrapper.findAll("[data-tooltip]");
      expect(tooltips[0].attributes("data-tooltip")).toBe(
        "Elevation difference",
      );
      expect(tooltips[1].attributes("data-tooltip")).toBe("Ascent");
      expect(tooltips[2].attributes("data-tooltip")).toBe("Descent");
      expect(tooltips[3].attributes("data-tooltip")).toBe("Highest point");
      expect(tooltips[4].attributes("data-tooltip")).toBe("Lowest point");
      expect(tooltips[5].attributes("data-tooltip")).toBe("Distance");
      expect(tooltips[6].attributes("data-tooltip")).toBe("Slope distance");
    });

    it("renders icons for each entry", () => {
      const wrapper = mountComponent();
      const icons = wrapper.findAll("[data-icon]");
      expect(icons.length).toBeGreaterThanOrEqual(7);
    });

    it("renders slot content", () => {
      const wrapper = mountComponent();
      expect(wrapper.text()).toContain("slot content");
    });

    it("applies border separator class except on last entry", () => {
      const wrapper = mountComponent();
      const entries = wrapper.findAll("small");
      const lastEntry = entries[entries.length - 1];
      expect(lastEntry.classes()).not.toContain("border-r");
    });
  });
});
