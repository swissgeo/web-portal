import type { RouteLocationNormalizedLoaded } from "vue-router";

import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import { defineComponent } from "vue";

const PageIdentityProbe = defineComponent({
  setup() {
    const router = useRouter();

    function keys(path: string) {
      const route = router.resolve(path);
      return route.matched.map(({ meta }) => {
        if (typeof meta.key === "function") {
          return meta.key(route as RouteLocationNormalizedLoaded);
        }
        return meta.key;
      });
    }

    return { keys };
  },
  template: "<div />",
});

describe("page identity", () => {
  it("keeps dataset identity across languages and distinguishes datasets", async () => {
    const wrapper = await mountSuspended(PageIdentityProbe);

    expect(wrapper.vm.keys("/de/dataset/dataset-a")).toEqual([
      "map",
      "dataset-a",
    ]);
    expect(wrapper.vm.keys("/fr/dataset/dataset-a")).toEqual([
      "map",
      "dataset-a",
    ]);
    expect(wrapper.vm.keys("/fr/dataset/dataset-b")).toEqual([
      "map",
      "dataset-b",
    ]);
    expect(wrapper.vm.keys("/fr/map")).toEqual(["map"]);
    expect(
      wrapper.vm.keys("/fr/dataset/dataset-a?state=example#legend"),
    ).toEqual(["map", "dataset-a"]);

    wrapper.unmount();
  });

  it.each(["embed", "print", "page"])(
    "keeps the %s page across languages",
    async (page) => {
      const wrapper = await mountSuspended(PageIdentityProbe);

      expect(wrapper.vm.keys(`/de/${page}`)).toEqual([page]);
      expect(wrapper.vm.keys(`/fr/${page}`)).toEqual([page]);

      wrapper.unmount();
    },
  );
});
