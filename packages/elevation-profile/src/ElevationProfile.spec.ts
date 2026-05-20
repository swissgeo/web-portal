import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";

import type { ElevationProfileResponse } from "@/types";

import ElevationProfile from "@/ElevationProfile.vue";
import { makeProfile } from "@/test/fixtures";

const makeLabels = () => ({
  plot: { xAxis: "Distance", yAxis: "Altitude", noData: "No data" },
  metadata: {
    elevationDifference: "Elevation difference",
    elevationUp: "Ascent",
    elevationDown: "Descent",
    poiUp: "Highest point",
    poiDown: "Lowest point",
    distance: "Distance",
    slopeDistance: "Slope distance",
  },
});

const StubButton = defineComponent({
  props: { icon: String },
  emits: ["click"],
  setup(_, { emit }) {
    return () => h("button", { onClick: () => emit("click") });
  },
});

function mountComponent(profileResponse = makeProfile()) {
  return mount(ElevationProfile, {
    props: {
      profileResponse,
      isLoading: false,
      labels: makeLabels(),
    },
    global: {
      stubs: {
        ElevationProfilePlot: {
          props: ["profile", "labels"],
          template:
            '<div data-testid="plot" :data-profile="JSON.stringify(profile)" />',
        },
        ElevationProfileMetadata: {
          template: '<div data-testid="metadata"><slot /></div>',
        },
        UButton: StubButton,
      },
    },
  });
}

describe("ElevationProfile", () => {
  describe("reverse toggle", () => {
    it("renders the profile in its original direction initially", () => {
      const wrapper = mountComponent();
      const plot = wrapper.find('[data-testid="plot"]');
      const profile = JSON.parse(
        plot.attributes("data-profile") ?? "{}",
      ) as ElevationProfileResponse;
      expect(profile.points[0].dist).toBe(0);
      expect(profile.metadata.elevationDifference).toBe(100);
    });

    it("reverses the profile when the first button is clicked", async () => {
      const wrapper = mountComponent();
      const buttons = wrapper.findAll("button");
      await buttons[0].trigger("click");

      const plot = wrapper.find('[data-testid="plot"]');
      const profile = JSON.parse(
        plot.attributes("data-profile") ?? "{}",
      ) as ElevationProfileResponse;
      expect(profile.metadata.elevationDifference).toBe(-100);
      expect(profile.metadata.totalAscent).toBe(0);
      expect(profile.metadata.totalDescent).toBe(100);
    });

    it("restores the original profile when the reverse button is clicked again", async () => {
      const wrapper = mountComponent();
      const buttons = wrapper.findAll("button");
      await buttons[0].trigger("click");
      await buttons[0].trigger("click");

      const plot = wrapper.find('[data-testid="plot"]');
      const profile = JSON.parse(
        plot.attributes("data-profile") ?? "{}",
      ) as ElevationProfileResponse;
      expect(profile.metadata.elevationDifference).toBe(100);
    });
  });

  describe("CSV export", () => {
    it("triggers a download when the download button is clicked", async () => {
      const createObjectURLMock = vi.fn(() => "blob:mock-url");
      const revokeObjectURLMock = vi.fn();
      vi.stubGlobal("URL", {
        ...URL,
        createObjectURL: createObjectURLMock,
        revokeObjectURL: revokeObjectURLMock,
      });
      vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
        () => {},
      );

      const wrapper = mountComponent();
      const buttons = wrapper.findAll("button");
      await buttons[1].trigger("click");

      expect(createObjectURLMock).toHaveBeenCalledOnce();
      expect(
        (createObjectURLMock.mock.calls[0] as unknown[])[0],
      ).toBeInstanceOf(Blob);

      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    it("uses the default filename 'export.csv' when no filename prop is given", async () => {
      vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
        () => {},
      );
      const appendSpy = vi.spyOn(document.body, "appendChild");
      vi.stubGlobal("URL", {
        ...URL,
        createObjectURL: vi.fn(() => "blob:mock-url"),
        revokeObjectURL: vi.fn(),
      });

      const wrapper = mountComponent();
      const buttons = wrapper.findAll("button");
      await buttons[1].trigger("click");

      const link = appendSpy.mock.calls[0]?.[0] as HTMLAnchorElement;
      expect(link.download).toBe("export.csv");

      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    it("appends .csv to a provided filename that lacks the extension", async () => {
      vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
        () => {},
      );
      vi.stubGlobal("URL", {
        ...URL,
        createObjectURL: vi.fn(() => "blob:mock-url"),
        revokeObjectURL: vi.fn(),
      });
      const appendSpy = vi.spyOn(document.body, "appendChild");

      const wrapper = mount(ElevationProfile, {
        props: {
          profileResponse: makeProfile(),
          isLoading: false,
          labels: makeLabels(),
          filename: "my-profile",
        },
        global: {
          stubs: {
            ElevationProfilePlot: { template: "<div />" },
            ElevationProfileMetadata: { template: "<div><slot /></div>" },
            UButton: StubButton,
          },
        },
      });

      const buttons = wrapper.findAll("button");
      await buttons[1].trigger("click");

      const link = appendSpy.mock.calls[0]?.[0] as HTMLAnchorElement;
      expect(link.download).toBe("my-profile.csv");

      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    it("does not double-append .csv to a filename that already has it", async () => {
      vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
        () => {},
      );
      vi.stubGlobal("URL", {
        ...URL,
        createObjectURL: vi.fn(() => "blob:mock-url"),
        revokeObjectURL: vi.fn(),
      });
      const appendSpy = vi.spyOn(document.body, "appendChild");

      const wrapper = mount(ElevationProfile, {
        props: {
          profileResponse: makeProfile(),
          isLoading: false,
          labels: makeLabels(),
          filename: "data.csv",
        },
        global: {
          stubs: {
            ElevationProfilePlot: { template: "<div />" },
            ElevationProfileMetadata: { template: "<div><slot /></div>" },
            UButton: StubButton,
          },
        },
      });

      const buttons = wrapper.findAll("button");
      await buttons[1].trigger("click");

      const link = appendSpy.mock.calls[0]?.[0] as HTMLAnchorElement;
      expect(link.download).toBe("data.csv");

      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });
  });
});
