import log from "@swissgeo/log";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { IconApiDescription } from "@/core/Icon";
import type { IconSetApiDescription } from "@/core/IconSet";

import { hexColorToRgb, rgbaToHex } from "@/core/color";
import { Icon } from "@/core/Icon";
import { IconSet } from "@/core/IconSet";

const iconPayload: IconApiDescription = {
  anchor: [12, 24],
  description: {
    de: "Haltestelle",
    fr: "Arrêt",
    it: "Fermata",
  },
  icon_set: "transport",
  name: "stop",
  size: [24, 32],
  template_url:
    "https://icons.test/{icon_set_name}/{icon_name}/{icon_scale}/{r}/{g}/{b}.png",
  url: "https://icons.test/transport/stop.png",
};

const iconSetPayload: IconSetApiDescription = {
  colorable: true,
  has_description: true,
  icons_url: "https://icons.test/transport.json",
  language: "fr",
  name: "transport",
  template_url: "https://icons.test/template.png",
};

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(log, "error").mockImplementation(() => undefined);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

describe("color conversions", () => {
  it.each([
    ["#000000", [0, 0, 0]],
    ["#12ab34", [18, 171, 52]],
    ["#FFFFFF", [255, 255, 255]],
  ] as const)("converts %s to RGB", (hex, expected) => {
    expect(hexColorToRgb(hex)).toEqual(expected);
  });

  it("rounds RGBA channels and ignores alpha", () => {
    expect(rgbaToHex([12.4, 127.5, 254.6, 0.2])).toBe("#0c80ff");
  });

  it.each([{ color: [] }, { color: [1] }, { color: [1, 2] }])(
    "falls back to black for an invalid RGBA value",
    ({ color }: { color: number[] }) => {
      expect(rgbaToHex(color)).toBe("#000000");
    },
  );
});

describe("Icon", () => {
  it("exposes API metadata and builds default and customized URLs", () => {
    const icon = new Icon(iconPayload);

    expect(icon.getAnchor()).toEqual([12, 24]);
    expect(icon.getSize()).toEqual([24, 32]);
    expect(icon.getIconSet()).toBe("transport");
    expect(icon.getName()).toBe("stop");
    expect(icon.getDescription()).toEqual(iconPayload.description);
    expect(icon.getUrl()).toBe(
      "https://icons.test/transport/stop/1x/255/0/0.png",
    );
    expect(icon.getUrl({ color: "#12ab34", scale: 2 })).toBe(
      "https://icons.test/transport/stop/2x/18/171/52.png",
    );
  });

  it("derives capabilities and localized descriptions from its icon set", () => {
    const icon = new Icon(iconPayload);
    const iconSet = new IconSet(iconSetPayload);

    expect(icon.getDefaultDescription()).toBeNull();
    expect(icon.isColorable()).toBe(false);
    expect(icon.hasDescription()).toBe(false);

    icon.setIconSetInstance(iconSet);

    expect(icon.getDefaultDescription()).toBe("Arrêt");
    expect(icon.isColorable()).toBe(true);
    expect(icon.hasDescription()).toBe(true);
  });

  it("returns no default description without description data or language", () => {
    const icon = new Icon({ ...iconPayload, description: null });
    const iconSet = new IconSet({ ...iconSetPayload, language: null });
    icon.setIconSetInstance(iconSet);

    expect(icon.getDefaultDescription()).toBeNull();
  });
});

describe("IconSet", () => {
  it("loads icons and links each icon back to the set", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ items: [iconPayload] }),
    });
    const iconSet = new IconSet(iconSetPayload);

    await iconSet.loadIcons();

    expect(fetchMock).toHaveBeenCalledWith(iconSetPayload.icons_url);
    expect(iconSet.icons).toHaveLength(1);
    expect(iconSet.getIconByName("stop")?.iconSetInstance).toBe(iconSet);
    expect(iconSet.getIconByName("missing")).toBeUndefined();
  });

  it("clears stale icons and logs a failed response", async () => {
    const iconSet = new IconSet(iconSetPayload);
    iconSet.icons.push(new Icon(iconPayload));
    fetchMock.mockResolvedValue({ ok: false, statusText: "Unavailable" });

    await iconSet.loadIcons();

    expect(iconSet.icons).toEqual([]);
    expect(log.error).toHaveBeenCalledWith("Error loading icons");
  });

  it.each([
    ["default", "Default Icons"],
    ["babs-v2-de", "Zivile signaturen"],
    ["custom", "custom"],
  ])("provides the human-readable name for %s", (name, expected) => {
    expect(
      new IconSet({ ...iconSetPayload, name }).getHumanReadableName(),
    ).toBe(expected);
  });
});
