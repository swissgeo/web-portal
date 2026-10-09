import { mount } from "@vue/test-utils";
import ShareLink from "~/components/toolbox/share/ShareLink.vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

vi.mock("@chenfengyuan/vue-qrcode", () => ({
  default: {
    name: "VueQrcode",
    props: ["value", "size", "level", "background", "foreground"],
    template: '<div data-testid="share-link-qr" :data-value="value" />',
  },
}));

const stubs = {
  UFormField: {
    name: "UFormField",
    template: "<div><slot /></div>",
    props: ["label", "size"],
  },
  UInput: {
    name: "UInput",
    template: '<div><slot name="trailing" /></div>',
    props: ["modelValue", "icon", "size", "color", "variant", "ui"],
  },
  UCheckbox: {
    name: "UCheckbox",
    template: "<label />",
    props: ["label"],
  },
  UButton: {
    name: "UButton",
    template: '<button v-bind="$attrs"><slot /></button>',
    props: ["color", "size", "variant", "icon", "label"],
  },
};

const LINK = "https://example.test/map?state=abc";

function mountShareLink() {
  return mount(ShareLink, {
    props: { link: LINK, copied: false },
    global: { stubs },
  });
}

describe("ShareLink", () => {
  let openSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
  });

  afterEach(() => {
    openSpy.mockRestore();
  });

  it("renders the i18n keys for headings, social section and QR label", () => {
    const wrapper = mountShareLink();

    expect(wrapper.text()).toContain("toolbox.share.link.title");
    expect(wrapper.text()).toContain("toolbox.share.link.description");
    expect(wrapper.text()).toContain("toolbox.share.link.socialMediaLabel");
    expect(wrapper.text()).toContain("toolbox.share.link.qrCodeLabel");
  });

  it("emits copy when the copy button is clicked", async () => {
    const wrapper = mountShareLink();

    await wrapper.get('[data-testid="share-link-copy"]').trigger("click");

    expect(wrapper.emitted("copy")).toHaveLength(1);
  });

  it("opens the Facebook sharer with the encoded link", async () => {
    const wrapper = mountShareLink();

    await wrapper
      .get('[aria-label="toolbox.share.link.ariaLabel.facebook"]')
      .trigger("click");

    expect(openSpy).toHaveBeenCalledOnce();
    const url = openSpy.mock.calls[0][0] as string;
    expect(url).toContain("https://www.facebook.com/sharer/sharer.php");
    expect(url).toContain(encodeURIComponent(LINK));
    expect(url).toContain(encodeURIComponent("toolbox.share.link.shareText"));
  });

  it("opens the LinkedIn share endpoint with the encoded link", async () => {
    const wrapper = mountShareLink();

    await wrapper
      .get('[aria-label="toolbox.share.link.ariaLabel.linkedin"]')
      .trigger("click");

    expect(openSpy).toHaveBeenCalledOnce();
    const url = openSpy.mock.calls[0][0] as string;
    expect(url).toContain("https://www.linkedin.com/shareArticle");
    expect(url).toContain(encodeURIComponent(LINK));
  });

  it("opens WhatsApp with the encoded link and share text", async () => {
    const wrapper = mountShareLink();

    await wrapper
      .get('[aria-label="toolbox.share.link.ariaLabel.whatsapp"]')
      .trigger("click");

    expect(openSpy).toHaveBeenCalledOnce();
    const url = openSpy.mock.calls[0][0] as string;
    expect(url).toContain("https://wa.me/?text=");
    expect(
      url.includes(encodeURIComponent("toolbox.share.link.shareText\n" + LINK)),
    ).toBe(true);
  });

  it("renders the QR code with the share link as value", () => {
    const wrapper = mountShareLink();

    const qr = wrapper.get('[data-testid="share-link-qr"]');
    expect(qr.attributes("data-value")).toBe(LINK);
  });
});
