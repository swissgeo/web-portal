import log from "@swissgeo/log";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IconApiDescription } from "@/core/Icon";
import type { IconSetApiDescription } from "@/core/IconSet";

import { DEFAULT_ICON_SET_NAME, useIconsStore } from "@/stores/icons.store";

const defaultSet: IconSetApiDescription = {
  colorable: true,
  has_description: false,
  icons_url: "https://icons.test/default.json",
  language: null,
  name: DEFAULT_ICON_SET_NAME,
  template_url: "https://icons.test/template.png",
};

const defaultIcon: IconApiDescription = {
  anchor: [16, 32],
  description: null,
  icon_set: DEFAULT_ICON_SET_NAME,
  name: "marker",
  size: [32, 32],
  template_url:
    "https://icons.test/{icon_set_name}/{icon_name}/{icon_scale}/{r}/{g}/{b}.png",
  url: "https://icons.test/default/marker.png",
};

const fetchMock = vi.fn();

beforeEach(() => {
  setActivePinia(createPinia());
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(log, "error").mockImplementation(() => undefined);
});

describe("icons store", () => {
  it("safely returns no default from an empty store", () => {
    const store = useIconsStore();

    expect(store.getDefaultIconSet()).toBeUndefined();
    expect(store.getIconSetByName("missing")).toBeUndefined();
    expect(store.defaultIconName).toBe("");
  });

  it("loads icon sets and their icons", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ items: [defaultSet] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ items: [defaultIcon] }),
      });
    const store = useIconsStore();

    await store.loadIconSets("https://icons.test/sets.json");

    expect(store.isLoading).toBe(false);
    expect(store.isReady).toBe(true);
    expect(store.iconSets).toHaveLength(1);
    expect(store.getDefaultIconSet()?.name).toBe(DEFAULT_ICON_SET_NAME);
    expect(store.getIconSetByName("missing")?.name).toBe(DEFAULT_ICON_SET_NAME);
    expect(store.defaultIconName).toBe("marker");
  });

  it("finishes in a ready empty state when loading fails", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    const store = useIconsStore();

    await store.loadIconSets("https://icons.test/sets.json");

    expect(store.isLoading).toBe(false);
    expect(store.isReady).toBe(true);
    expect(store.iconSets).toEqual([]);
    expect(log.error).toHaveBeenCalledWith("Error loading icon set");
  });
});
