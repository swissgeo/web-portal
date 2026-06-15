import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { LV95 } from "@swissgeo/coordinates";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

const BERN_LV95: [number, number] = [2600000, 1200000];

const { w3wData, elevationData, w3wPending, elevationPending } =
  await vi.hoisted(async () => {
    const { ref } = await import("vue");
    return {
      w3wData: ref<{ words: string } | null>(null),
      elevationData: ref<{ height: string } | null>(null),
      w3wPending: ref(false),
      elevationPending: ref(false),
    };
  });

mockNuxtImport("useFetch", () => {
  return (url: string) => {
    if (url.includes("what3words")) {
      return { data: w3wData, pending: w3wPending };
    }
    return { data: elevationData, pending: elevationPending };
  };
});

mockNuxtImport("useI18n", () => {
  return () => ({
    t: (key: string) => key,
    locale: ref("en"),
  });
});

vi.mock("@swissgeo/log", async (importOriginal) => {
  const original = await importOriginal();
  return {
    default: { error: vi.fn() },
    // @ts-expect-error Spreading this actually works and is foreseen by the docs
    ...original,
  };
});

async function setup(coordinate: [number, number] | null = BERN_LV95) {
  const { useContextMenuPosition } =
    await import("~/composables/useContextMenuPosition");
  const coord = ref<[number, number] | null>(coordinate);
  return useContextMenuPosition(coord, ref(LV95));
}

describe("useContextMenuPosition", () => {
  beforeEach(() => {
    w3wData.value = null;
    elevationData.value = null;
    w3wPending.value = false;
    elevationPending.value = false;
    vi.clearAllMocks();
  });

  it("returns empty rows while loading", async () => {
    w3wPending.value = true;
    const { rows } = await setup();
    expect(rows.value).toEqual([]);
  });

  it("formats elevation correctly in meters and feet", async () => {
    w3wData.value = { words: "filled.count.soap" };
    elevationData.value = { height: "549.5" };

    const { rows } = await setup();
    const elevRow = rows.value.find(
      (r) => r.label === "map.contextMenuPopup.elevation",
    );

    expect(elevRow?.value).toBe("549.50m\n1802.82ft");
  });

  it("falls back to error key when elevation data is missing", async () => {
    w3wData.value = { words: "filled.count.soap" };
    elevationData.value = null;

    const { rows } = await setup();
    const elevRow = rows.value.find(
      (r) => r.label === "map.contextMenuPopup.elevation",
    );

    expect(elevRow?.value).toBe("map.contextMenuPopup.errorFetchingElevation");
  });

  it("falls back to error key when w3w data is missing", async () => {
    w3wData.value = null;
    elevationData.value = { height: "549.5" };

    const { rows } = await setup();
    const w3wRow = rows.value.find((r) => r.label === "what3words");

    expect(w3wRow?.value).toBe("map.contextMenuPopup.errorFetchingW3W");
  });
});
