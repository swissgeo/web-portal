import type { FeatureData } from "@swissgeo/feature";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import FeatureInfoContent from "../featuresinfo/FeatureInfoContent.vue";

const { sanitizeHtmlMock } = vi.hoisted(() => ({
  sanitizeHtmlMock: vi.fn((html: string) => `<sanitized>${html}</sanitized>`),
}));

vi.mock("@/utils/sanitize", () => ({
  sanitizeHtml: sanitizeHtmlMock,
}));

// t is mocked so the component tests do not depend on translation updates;
const mockedT = vi.fn((key: string) => `t:${key}`);

mockNuxtImport("useI18n", () => {
  return () => ({ t: mockedT });
});

function makeFeatureData(
  content: FeatureData["content"],
  featureId = "feature-1",
): FeatureData {
  return {
    featureId,
    geometry: { type: "Point", coordinates: [2600000, 1200000] },
    content,
  };
}

describe("FeatureInfoContent.vue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("html content", () => {
    it("renders trusted html as-is, without sanitizing", () => {
      const wrapper = mount(FeatureInfoContent, {
        props: {
          featureData: makeFeatureData({
            kind: "html",
            html: "<p>popup</p>",
            trusted: true,
          }),
        },
      });

      expect(wrapper.html()).toContain("<p>popup</p>");
      expect(sanitizeHtmlMock).not.toHaveBeenCalled();
    });

    it("sanitizes untrusted html before rendering", () => {
      const wrapper = mount(FeatureInfoContent, {
        props: {
          featureData: makeFeatureData({
            kind: "html",
            html: "<p>external</p>",
            trusted: false,
          }),
        },
      });

      expect(wrapper.html().replace(/\s+/g, "")).toContain(
        "<sanitized><p>external</p></sanitized>",
      );
      expect(sanitizeHtmlMock).toHaveBeenCalledWith(
        "<p>external</p>",
        "t:featureInfo.blockedContent",
      );
    });
  });

  describe("json content", () => {
    it("renders each property as a key/value pair", () => {
      const wrapper = mount(FeatureInfoContent, {
        props: {
          featureData: makeFeatureData({
            kind: "json",
            properties: { name: "Grüsch", altitude: 594 },
          }),
        },
      });

      const text = wrapper.text();
      expect(text).toContain("name");
      expect(text).toContain("Grüsch");
      expect(text).toContain("altitude");
      expect(text).toContain("594");
      expect(sanitizeHtmlMock).not.toHaveBeenCalled();
    });

    it("sanitizes only the description key and renders it as html", () => {
      const wrapper = mount(FeatureInfoContent, {
        props: {
          featureData: makeFeatureData({
            kind: "json",
            properties: {
              description: "<div>rich description</div>",
              name: "plain",
            },
          }),
        },
      });

      expect(sanitizeHtmlMock).toHaveBeenCalledExactlyOnceWith(
        "<div>rich description</div>",
        "t:featureInfo.blockedContent",
      );
      expect(wrapper.html().replace(/\s+/g, "")).toContain(
        "<sanitized><div>richdescription</div></sanitized>",
      );
    });

    it("renders falsy but non-nullish values (0, false, empty string)", () => {
      const wrapper = mount(FeatureInfoContent, {
        props: {
          featureData: makeFeatureData({
            kind: "json",
            properties: {
              temperature: 0,
              isPublic: false,
              remark: "",
            },
          }),
        },
      });

      const text = wrapper.text();
      expect(text).toContain("temperature");
      expect(text).toContain("0");
      expect(text).toContain("isPublic");
      expect(text).toContain("false");
      expect(text).toContain("remark");
    });

    it("removes null and undefined properties", () => {
      const wrapper = mount(FeatureInfoContent, {
        props: {
          featureData: makeFeatureData({
            kind: "json",
            properties: {
              name: "kept",
              nothing: null,
              absent: undefined,
            },
          }),
        },
      });

      expect(wrapper.text()).toContain("kept");
      expect(wrapper.text()).not.toContain("nothing");
      expect(wrapper.text()).not.toContain("absent");
    });

    it("renders a non-string description as plain text without sanitizing", () => {
      const wrapper = mount(FeatureInfoContent, {
        props: {
          featureData: makeFeatureData({
            kind: "json",
            properties: { description: 42 },
          }),
        },
      });

      expect(wrapper.text()).toContain("42");
      expect(sanitizeHtmlMock).not.toHaveBeenCalled();
    });

    it("shows the no-information fallback when all properties are nullish", () => {
      const wrapper = mount(FeatureInfoContent, {
        props: {
          featureData: makeFeatureData({
            kind: "json",
            properties: { nothing: null },
          }),
        },
      });

      expect(wrapper.text()).toContain("t:featureInfo.noInformation");
    });

    it("shows the no-information fallback for empty properties", () => {
      const wrapper = mount(FeatureInfoContent, {
        props: {
          featureData: makeFeatureData({ kind: "json", properties: {} }),
        },
      });

      expect(wrapper.text()).toContain("t:featureInfo.noInformation");
    });
  });

  describe("reactivity", () => {
    it("re-dispatches when the feature prop changes (pagination)", async () => {
      const wrapper = mount(FeatureInfoContent, {
        props: {
          featureData: makeFeatureData({
            kind: "html",
            html: "<p>first</p>",
            trusted: true,
          }),
        },
      });

      await wrapper.setProps({
        featureData: makeFeatureData(
          { kind: "json", properties: { name: "second" } },
          "feature-2",
        ),
      });

      expect(wrapper.text()).toContain("second");
      expect(wrapper.text()).not.toContain("first");
    });
  });
});
