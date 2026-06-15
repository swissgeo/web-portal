import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import FileConverter from "../FileConverter.vue";

describe("FileConverter", () => {
  it("maps the data correctly", async () => {
    const layerData = {
      data: `<xml>KML data here</xml>`,
      type: "kml" as const,
      uuid: "kml-is-a-snowflake",
      humanId: "K to the M to the L",
      isLoading: false,
    };
    const wrapper = mount(FileConverter, {
      props: {
        layer: layerData,
      },
    });

    const updateEvents = wrapper.emitted("update");

    expect(wrapper.emitted("update")).toHaveLength(1);
    expect(updateEvents![0]).toEqual([
      {
        ...layerData,
        format: "KML",
        layerId: "K to the M to the L",
        displayName: "K to the M to the L",
        isVisible: true,
        opacity: 1,
      },
    ]);

    await wrapper.setProps({
      layer: {
        ...layerData,
      },
    });
    expect(updateEvents).toHaveLength(2);
    expect(updateEvents![1]![0]).toHaveProperty("isVisible", true);

    await wrapper.setProps({
      layer: {
        ...layerData,
      },
    });
    expect(updateEvents).toHaveLength(3);
  });

  it("emits the remove signal when unmounted", () => {
    const layerData = {
      data: `<xml>KML data here</xml>`,
      type: "kml" as const,
      uuid: "kml-is-a-snowflake",
      humanId: "K to the M to the L",
      isVisible: false,
      opacity: 0,
      isLoading: false,
    };
    const wrapper = mount(FileConverter, {
      props: {
        layer: layerData,
      },
    });

    wrapper.unmount();
    expect(wrapper.emitted("remove")).toHaveLength(1);
  });
});
