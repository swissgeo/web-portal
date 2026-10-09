import type * as VueUse from "@vueuse/core";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import Share from "~/components/toolbox/share/Share.vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { sharing, linkClipboard, embedClipboard } = await vi.hoisted(
  async () => {
    const { ref } = await import("vue");
    return {
      sharing: {
        shareLink: ref("https://example.test/share"),
        embedCode: ref('<iframe src="https://example.test/embed"></iframe>'),
        hash: ref("state-id"),
      },
      linkClipboard: { copied: ref(false), copy: vi.fn() },
      embedClipboard: { copied: ref(false), copy: vi.fn() },
    };
  },
);

let clipboardIndex = 0;
vi.mock("@vueuse/core", async (importOriginal) => ({
  ...(await importOriginal<typeof VueUse>()),
  useClipboard: () => {
    clipboardIndex += 1;
    return clipboardIndex % 2 === 1 ? linkClipboard : embedClipboard;
  },
}));
vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));
mockNuxtImport("useStateConfig", () => {
  return () => ({ exportState: () => ({}) });
});
mockNuxtImport("useCreateShareLink", () => {
  return () => sharing;
});

const stubs = {
  UAlert: {
    name: "UAlert",
    template: '<div><slot name="description" /><slot /></div>',
    props: ["title", "icon", "color", "variant", "close"],
  },
  UTabs: {
    name: "UTabs",
    template: '<div><slot name="link" /><slot name="embed" /></div>',
    props: ["items", "variant", "ui"],
  },
  ShareLink: {
    name: "ShareLink",
    props: ["link", "copied"],
    emits: ["copy"],
    template: '<div data-testid="share-link-stub" />',
  },
  ShareEmbed: {
    name: "ShareEmbed",
    props: [
      "embedCode",
      "copied",
      "stateId",
      "zoomOnlyCtrl",
      "fullWidth",
      "resolution",
    ],
    emits: [
      "copy",
      "update:zoomOnlyCtrl",
      "update:fullWidth",
      "update:resolution",
    ],
    template: '<div data-testid="share-embed-stub" />',
  },
};

function mountShare() {
  return mount(Share, { global: { stubs } });
}

describe("Share", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    linkClipboard.copied.value = false;
    embedClipboard.copied.value = false;
    clipboardIndex = 0;
  });

  it("renders both tabs with i18n labels", () => {
    const wrapper = mountShare();
    const tabs = wrapper.getComponent({ name: "UTabs" });

    expect(tabs.props("items")).toEqual([
      { label: "toolbox.share.link.title", slot: "link" },
      { label: "toolbox.share.embed.title", slot: "embed" },
    ]);
  });

  it("passes embed state and resolution models to ShareEmbed", () => {
    const wrapper = mountShare();
    const embed = wrapper.getComponent({ name: "ShareEmbed" });

    expect(embed.props("embedCode")).toBe(sharing.embedCode.value);
    expect(embed.props("stateId")).toBe("state-id");
    expect(embed.props("zoomOnlyCtrl")).toBe(false);
    expect(embed.props("fullWidth")).toBe(false);
    expect(embed.props("resolution")).toEqual({ width: 800, height: 600 });
  });

  it("copies link and embed code independently on child copy events", async () => {
    const wrapper = mountShare();

    await wrapper.getComponent({ name: "ShareEmbed" }).vm.$emit("copy");
    expect(embedClipboard.copy).toHaveBeenCalledExactlyOnceWith(
      sharing.embedCode.value,
    );
    expect(linkClipboard.copy).not.toHaveBeenCalled();

    await wrapper.getComponent({ name: "ShareLink" }).vm.$emit("copy");
    expect(linkClipboard.copy).toHaveBeenCalledExactlyOnceWith(
      sharing.shareLink.value,
    );
  });

  it("propagates copied confirmation state to the matching child only", async () => {
    const wrapper = mountShare();

    embedClipboard.copied.value = true;
    await wrapper.vm.$nextTick();

    expect(wrapper.getComponent({ name: "ShareEmbed" }).props("copied")).toBe(
      true,
    );
    expect(wrapper.getComponent({ name: "ShareLink" }).props("copied")).toBe(
      false,
    );
  });
});
