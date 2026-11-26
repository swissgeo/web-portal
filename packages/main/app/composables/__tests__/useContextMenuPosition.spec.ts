import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { LV95 } from "@swissgeo/coordinates";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

const BERN_LV95: [number, number] = [2600000, 1200000];

const { elevationData, elevationPending } = await vi.hoisted(async () => {
  const { ref } = await import("vue");
  return {
    elevationData: ref<{ height: string } | null>(null),
    elevationPending: ref(false),
  };
});

mockNuxtImport("useFetch", () => {
  return () => ({ data: elevationData, pending: elevationPending });
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
    elevationData.value = null;
    elevationPending.value = false;
    vi.clearAllMocks();
  });

  it("returns empty rows while loading", async () => {
    elevationPending.value = true;
    const { rows } = await setup();
    expect(rows.value).toEqual([]);
  });

  it("formats elevation correctly in meters and feet", async () => {
    elevationData.value = { height: "549.5" };

    const { rows } = await setup();
    const elevRow = rows.value.find(
      (r) => r.label === "map.contextMenuPopup.elevation",
    );

    expect(elevRow?.value).toBe("549.50m\n1802.82ft");
  });

  it("falls back to error key when elevation data is missing", async () => {
    elevationData.value = null;

    const { rows } = await setup();
    const elevRow = rows.value.find(
      (r) => r.label === "map.contextMenuPopup.elevation",
    );

    expect(elevRow?.value).toBe("map.contextMenuPopup.errorFetchingElevation");
  });
});
