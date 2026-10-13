import { mount } from "@vue/test-utils";
import PlacementSelector from "~/components/toolbox/drawing/PlacementSelector.vue";
import { describe, expect, it, vi } from "vitest";

const placements = [
  "north-west",
  "north",
  "north-east",
  "west",
  "center",
  "east",
  "south-west",
  "south",
  "south-east",
] as const;

vi.mock("vue-i18n", () => ({ useI18n: () => ({ t: (key: string) => key }) }));

describe("PlacementSelector", () => {
  it.each(placements)(
    "emits %s when its cell is clicked",
    async (placement) => {
      const wrapper = mount(PlacementSelector, {
        global: { stubs: { UIcon: true } },
        props: { placement: "center" },
      });
      const index = placements.indexOf(placement);

      await wrapper.findAll(".aspect-square")[index]!.trigger("click");

      expect(wrapper.emitted("placement-selected")).toContainEqual([placement]);
    },
  );

  it("highlights only the selected placement", () => {
    const wrapper = mount(PlacementSelector, {
      global: { stubs: { UIcon: true } },
      props: { placement: "south-east" },
    });
    const cells = wrapper.findAll(".aspect-square");

    expect(
      cells.filter((cell) => cell.attributes("aria-pressed") === "true"),
    ).toHaveLength(1);
    expect(cells[8]!.attributes("aria-pressed")).toBe("true");
  });
});
