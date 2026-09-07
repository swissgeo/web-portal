import type * as VueUse from "@vueuse/core";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import Share from "~/components/toolbox/share/Share.vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { sharing, linkClipboard, embedClipboard, closeDetailPanel } =
  await vi.hoisted(async () => {
    const { ref } = await import("vue");
    return {
      sharing: {
        shareLink: ref("https://example.test/share"),
        embedCode: ref('<iframe src="https://example.test/embed"></iframe>'),
        needToRefresh: ref(false),
        refresh: vi.fn(),
      },
      linkClipboard: { copied: ref(false), copy: vi.fn() },
      embedClipboard: { copied: ref(false), copy: vi.fn() },
      closeDetailPanel: vi.fn(),
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
vi.mock("~/stores/toolbox", () => ({
  useToolboxStore: () => ({ closeDetailPanel }),
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

function mountShare() {
  return mount(Share, {
    global: {
      stubs: {
        UCard: { template: '<div><slot name="header" /><slot /></div>' },
        UInput: { template: '<div><slot name="trailing" /></div>' },
        UCheckbox: true,
        UButton: { props: ["icon"], template: "<button><slot /></button>" },
      },
    },
  });
}

describe("Share", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sharing.needToRefresh.value = false;
    linkClipboard.copied.value = false;
    embedClipboard.copied.value = false;
    clipboardIndex = 0;
  });

  it("copies the link and embed code with independent confirmation states", async () => {
    const wrapper = mountShare();
    const buttons = wrapper.findAll(
      'button[aria-label="toolbox.share.ariaLabel.copyToClipboard"]',
    );

    expect(buttons).toHaveLength(2);
    await buttons[0]!.trigger("click");
    expect(linkClipboard.copy).toHaveBeenCalledExactlyOnceWith(
      sharing.shareLink.value,
    );
    expect(embedClipboard.copy).not.toHaveBeenCalled();

    linkClipboard.copied.value = true;
    await wrapper.vm.$nextTick();
    expect(buttons[0]!.classes()).toContain("text-success");
    expect(buttons[1]!.classes()).not.toContain("text-success");

    await buttons[1]!.trigger("click");
    expect(embedClipboard.copy).toHaveBeenCalledExactlyOnceWith(
      sharing.embedCode.value,
    );
    embedClipboard.copied.value = true;
    await wrapper.vm.$nextTick();
    expect(buttons[1]!.classes()).toContain("text-success");
  });

  it("refreshes expired share data and closes the panel", async () => {
    sharing.needToRefresh.value = true;
    const wrapper = mountShare();

    expect(
      wrapper
        .find('button[aria-label="toolbox.share.ariaLabel.copyToClipboard"]')
        .exists(),
    ).toBe(false);
    await wrapper
      .get('button[aria-label="toolbox.share.ariaLabel.refreshLink"]')
      .trigger("click");
    await wrapper
      .get('button[aria-label="toolbox.share.ariaLabel.refreshEmbed"]')
      .trigger("click");
    expect(sharing.refresh).toHaveBeenCalledTimes(2);
    await wrapper
      .get('button[aria-label="toolbox.share.ariaLabel.close"]')
      .trigger("click");
    expect(closeDetailPanel).toHaveBeenCalledOnce();
  });
});
