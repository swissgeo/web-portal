import type { AsyncDataRequestStatus } from "#app";
import type { ThesaurusConcept } from "~/types/thesaurus";

import { mount } from "@vue/test-utils";
import LayerCatalogTree from "~/components/sidebar/layerCatalog/LayerCatalogTree.vue";
import { describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick } from "vue";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

type TreeNode = {
  id: string;
  conceptId: string | null;
  label: string;
  children?: TreeNode[];
};

// UTree can't be rendered here, so this stub stands in for it
const UTree = defineComponent({
  props: ["modelValue", "items", "expanded", "getKey"],
  emits: ["update:modelValue", "update:expanded"],
  setup: () => () => h("div", { "data-testid": "tree-stub" }),
});

const concepts: ThesaurusConcept[] = [
  {
    id: "nature",
    label: "Natur und Umwelt",
    children: [{ id: "soils", label: "Boden", children: [] }],
  },
  { id: "planning", label: "Planung" },
];

function mountTree(
  conceptId: string | null,
  status: AsyncDataRequestStatus = "success",
) {
  const wrapper = mount(LayerCatalogTree, {
    props: {
      conceptId,
      concepts,
      status,
      "onUpdate:conceptId": (value: string | null) =>
        wrapper.setProps({ conceptId: value }),
    },
    global: { stubs: { UTree } },
  });
  return wrapper;
}

function tree(wrapper: ReturnType<typeof mountTree>) {
  return wrapper.getComponent(UTree);
}

describe("LayerCatalogTree.vue", () => {
  it("wraps the concepts in a root node for all layers", () => {
    const wrapper = mountTree(null);

    expect(tree(wrapper).props("items")).toEqual([
      {
        id: "root",
        conceptId: null,
        label: "layerCatalog.allLayers",
        children: [
          {
            id: "node_nature",
            conceptId: "nature",
            label: "Natur und Umwelt",
            children: [
              {
                id: "node_soils",
                conceptId: "soils",
                label: "Boden",
                children: [],
              },
            ],
          },
          {
            id: "node_planning",
            conceptId: "planning",
            label: "Planung",
            children: undefined,
          },
        ],
      },
    ]);
  });

  it("identifies the nodes by their id, not by their label", () => {
    const wrapper = mountTree(null);
    const getKey = tree(wrapper).props("getKey") as (_node: TreeNode) => string;
    const root = (tree(wrapper).props("items") as TreeNode[])[0]!;

    expect(getKey(root)).toBe("root");
  });

  it("starts with the root node expanded", () => {
    const wrapper = mountTree(null);

    expect(tree(wrapper).props("expanded")).toEqual(["root"]);
  });

  it("selects the root node when no concept is selected", () => {
    const wrapper = mountTree(null);

    expect(tree(wrapper).props("modelValue")).toMatchObject({ id: "root" });
  });

  it("selects the node of the selected concept", () => {
    const wrapper = mountTree("soils");

    expect(tree(wrapper).props("modelValue")).toMatchObject({
      id: "node_soils",
    });
  });

  it("selects the concept of the node selected in the tree", async () => {
    const wrapper = mountTree(null);
    const nature = (tree(wrapper).props("items") as TreeNode[])[0]!
      .children![0]!;

    tree(wrapper).vm.$emit("update:modelValue", nature);
    await nextTick();

    expect(wrapper.props("conceptId")).toBe("nature");
    expect(tree(wrapper).props("modelValue")).toMatchObject({
      id: "node_nature",
    });
  });

  it("selects the root when the tree selection is cleared", async () => {
    const wrapper = mountTree("soils");

    tree(wrapper).vm.$emit("update:modelValue", undefined);
    await nextTick();

    expect(wrapper.props("conceptId")).toBeNull();
  });

  it.each<AsyncDataRequestStatus>(["idle", "pending"])(
    "shows that the concepts are loading while the status is %s",
    (status) => {
      const wrapper = mountTree(null, status);

      expect(wrapper.text()).toBe("layerCatalog.loading");
      expect(wrapper.findComponent(UTree).exists()).toBe(false);
    },
  );

  it("shows an error when the concepts could not be loaded", () => {
    const wrapper = mountTree(null, "error");

    expect(wrapper.text()).toBe("layerCatalog.error");
    expect(wrapper.findComponent(UTree).exists()).toBe(false);
  });

  it("keeps the expanded nodes while the concepts are reloaded in another language", async () => {
    const wrapper = mountTree(null);
    tree(wrapper).vm.$emit("update:expanded", ["root", "node_nature"]);
    await nextTick();

    await wrapper.setProps({ status: "pending" });
    expect(wrapper.findComponent(UTree).exists()).toBe(false);
    await wrapper.setProps({ status: "success" });

    expect(tree(wrapper).props("expanded")).toEqual(["root", "node_nature"]);
  });
});
