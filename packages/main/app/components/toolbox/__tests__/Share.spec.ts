import type * as VueUse from "@vueuse/core";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import Share from "~/components/toolbox/share/Share.vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { sharing, linkClipboard, embedClipboard, mockShowError } =
  await vi.hoisted(async () => {
    const { ref } = await import("vue");
    return {
      sharing: {
        shareLink: ref("https://example.test/share"),
        embedCode: ref('<iframe src="https://example.test/embed"></iframe>'),
        embedUrl: ref("https://example.test/embed?state=state-id"),
        hash: ref("state-id"),
      },
      linkClipboard: { copied: ref(false), copy: vi.fn() },
      embedClipboard: { copied: ref(false), copy: vi.fn() },
      mockShowError: vi.fn(),
    };
  });

const { mockUseCreateShareLink, mockRefresh } = vi.hoisted(() => {
  const refresh = vi.fn();
  return {
    mockRefresh: refresh,
    mockUseCreateShareLink: vi.fn((_state: unknown, options?: unknown) => ({
      ...sharing,
      refresh,
      shareOptions: options,
    })),
  };
});

let clipboardIndex = 0;
vi.mock("@vueuse/core", async (importOriginal) => ({
  ...(await importOriginal<typeof VueUse>()),
  useClipboard: () => {
    clipboardIndex += 1;
    return clipboardIndex % 2 === 1 ? linkClipboard : embedClipboard;
  },
}));
const { mockCloseDetailPanel } = vi.hoisted(() => ({
  mockCloseDetailPanel: vi.fn(),
}));

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));
vi.mock("@/stores/toolbox", () => ({
  useToolboxStore: () => ({
    closeDetailPanel: mockCloseDetailPanel,
  }),
}));
mockNuxtImport("useToaster", () => {
  return () => ({ showError: mockShowError });
});
mockNuxtImport("useStateConfig", () => {
  return () => ({ exportState: () => ({}) });
});
mockNuxtImport("useCreateShareLink", () => {
  return mockUseCreateShareLink;
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
    props: ["link", "copied", "drawingEditable"],
    emits: ["copy", "update:drawingEditable"],
    template: '<div data-testid="share-link-stub" />',
  },
  ShareEmbed: {
    name: "ShareEmbed",
    props: [
      "embedCode",
      "embedUrl",
      "copied",
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

  it("renders both tabs with i18n tab labels", () => {
    const wrapper = mountShare();
    const tabs = wrapper.getComponent({ name: "UTabs" });

    expect(tabs.props("items")).toEqual([
      { label: "toolbox.share.link.tabLabel", slot: "link" },
      { label: "toolbox.share.embed.tabLabel", slot: "embed" },
    ]);
  });

  it("passes embed state and resolution models to ShareEmbed", () => {
    const wrapper = mountShare();
    const embed = wrapper.getComponent({ name: "ShareEmbed" });

    expect(embed.props("embedCode")).toBe(sharing.embedCode.value);
    expect(embed.props("embedUrl")).toBe(sharing.embedUrl.value);
    expect(embed.props("zoomOnlyCtrl")).toBe(false);
    expect(embed.props("fullWidth")).toBe(false);
    expect(embed.props("resolution")).toEqual({ width: 800, height: 600 });
  });

  it("debounces the automatic refresh and reports errors via toaster", () => {
    mountShare();

    const options = mockUseCreateShareLink.mock.calls[0]?.[1] as {
      autoRefresh: boolean;
      debounce: number;
      maxWait: number;
      onError: () => void;
    };
    expect(options.autoRefresh).toBe(true);
    expect(options.debounce).toBe(500);
    expect(options.maxWait).toBe(2000);

    options.onError();
    expect(mockShowError).toHaveBeenCalledWith("state.shareLinkError");
  });

  it("closes the detail panel when the close button is clicked", async () => {
    const wrapper = mountShare();

    await wrapper.getComponent({ name: "UAlert" }).vm.$emit("update:open");

    expect(mockCloseDetailPanel).toHaveBeenCalledOnce();
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

  it("refreshes the share link when drawingEditable toggles", async () => {
    const wrapper = mountShare();

    await wrapper
      .getComponent({ name: "ShareLink" })
      .vm.$emit("update:drawingEditable", true);

    expect(mockRefresh).toHaveBeenCalledOnce();
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
