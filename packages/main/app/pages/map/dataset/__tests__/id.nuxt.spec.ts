import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it, vi } from "vitest";
import { ref } from "vue";

import DatasetPage from "../[id].vue";

mockNuxtImport("useDatasetRecord", () => () => ({
  dataset: ref({
    id: "example.dataset",
    properties: {
      type: "Dataset",
      title: "Example dataset",
      description: "Example description",
    },
  }),
  distributionCollection: ref(null),
  distributionError: ref(false),
  isLoading: ref(false),
  error: ref(null),
  promise: Promise.resolve(),
}));

// The drawer renders nothing on the server, so search engines only get what
// the page puts into the head. Keep the title and description coming from the
// dataset record.
describe("dataset page", () => {
  it("sets the page title and description from the dataset record", async () => {
    const wrapper = await mountSuspended(DatasetPage, {
      route: "/de/dataset/example.dataset",
    });

    await vi.waitFor(() => {
      expect(document.title).toBe("Example dataset");
    });
    expect(
      document
        .querySelector('meta[name="description"]')
        ?.getAttribute("content"),
    ).toBe("Example description");
    wrapper.unmount();
  });
});
