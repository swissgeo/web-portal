import { mount } from "@vue/test-utils";
import PlacementSelector from "~/components/debug/PlacementSelector.vue";
import { describe, expect, it } from "vitest";

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

describe("PlacementSelector", () => {
  it.each(placements)(
    "emits %s when its cell is clicked",
    async (placement) => {
      const wrapper = mount(PlacementSelector, {
        props: { placement: "center" },
      });
      const index = placements.indexOf(placement);

      await wrapper.findAll(".aspect-square")[index]!.trigger("click");

      expect(wrapper.emitted("placement-selected")).toContainEqual([placement]);
    },
  );

  it("highlights only the selected placement", () => {
    const wrapper = mount(PlacementSelector, {
      props: { placement: "south-east" },
    });
    const cells = wrapper.findAll(".aspect-square");

    expect(
      cells.filter((cell) => cell.classes().includes("bg-gray-400")),
    ).toHaveLength(1);
    expect(cells[8]!.classes()).toContain("bg-gray-400");
  });
});
