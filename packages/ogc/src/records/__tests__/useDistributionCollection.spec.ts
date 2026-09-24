import { flushPromises } from "@vue/test-utils";
import { delay, http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { ref } from "vue";

import type { Dataset } from "@/types/Records";

import {
  useDistributionCollection,
  extractDistributionLink,
} from "../useDistributionCollection";
import ChBafuSchutzgebieteLuftfahrt from "./fixtures/dataset_ch.bafu.schutzgebiete-luftfahrt.json";
import ChBafuSchutzgebieteLuftfahrtDistributions from "./fixtures/distribution-collection_ch.bafu.schutzgebiete-luftfahrt.json";

describe("useDistributionCollection fetching the data distribution from the OGC records", () => {
  const handlers = [
    http.get(
      "https://services.dev.sgdi.tech/api/oar/rc1/collections/swissgeo-distributions/items/ch.bafu.schutzgebiete-luftfahrt",
      () => {
        return HttpResponse.json(ChBafuSchutzgebieteLuftfahrtDistributions);
      },
    ),
    http.get("http://services.dev.sgdi.tech/api/oar", () => {
      return HttpResponse.error();
    }),
    http.get("http://services.dev.sgdi.tech/slow", async () => {
      await delay(100);
      return HttpResponse.json(ChBafuSchutzgebieteLuftfahrtDistributions);
    }),
    http.get("http://services.dev.sgdi.tech/fast", () => {
      return HttpResponse.json(ChBafuSchutzgebieteLuftfahrtDistributions);
    }),
  ];
  const server = setupServer(...handlers);

  beforeAll(() => server.listen());

  afterAll(() => server.close());

  afterEach(() => server.resetHandlers());

  it("extracts the distribution link correctly", () => {
    const distributionLink = extractDistributionLink(
      ChBafuSchutzgebieteLuftfahrt as Dataset,
    );

    expect(distributionLink).toBe(
      "https://services.dev.sgdi.tech/api/oar/rc1/collections/swissgeo-distributions/items/ch.bafu.schutzgebiete-luftfahrt",
    );
  });

  it("fetches the distribution correctly", async () => {
    const dataset = ref(ChBafuSchutzgebieteLuftfahrt as Dataset);

    const { distributionCollection } = useDistributionCollection(dataset);

    expect(distributionCollection.value).toBe(null);
    await flushPromises();
    expect(distributionCollection.value).toEqual(
      ChBafuSchutzgebieteLuftfahrtDistributions,
    );
  });

  it("fetches the distribution correctly after the dataset becomes available", async () => {
    const dataset = ref<Dataset | null>(null);

    const { distributionCollection } = useDistributionCollection(dataset);

    dataset.value = ChBafuSchutzgebieteLuftfahrt as Dataset;

    await flushPromises();
    expect(distributionCollection.value).toEqual(
      ChBafuSchutzgebieteLuftfahrtDistributions,
    );
  });

  it("reports a missing distribution URL", () => {
    const dataset = ref<Dataset | null>({
      id: "some-dataset",
      links: [],
    } as unknown as Dataset);

    const { distributionCollection, onDistributionError } =
      useDistributionCollection(dataset);
    const reportError = vi.fn();
    onDistributionError(reportError);

    expect(distributionCollection.value).toBe(null);
    expect(reportError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Required distribution URL is missing",
      }),
    );
  });

  it("doesn't trip with an unreachable URL", async () => {
    const dataset = ref<Dataset | null>({
      id: "some-dataset",
      links: [
        {
          href: "http://services.dev.sgdi.tech/api/oar",
          rel: "distributions",
          title: "Distributions",
        },
      ],
    } as unknown as Dataset);

    const { distributionCollection, onDistributionError } =
      useDistributionCollection(dataset);
    const reportError = vi.fn();
    onDistributionError(reportError);
    await flushPromises();
    expect(distributionCollection.value).toBe(null);
    expect(reportError).toHaveBeenCalledWith(expect.any(Error));
  });

  it("does not report a cancelled stale request", async () => {
    const dataset = ref<Dataset | null>({
      links: [
        { href: "http://services.dev.sgdi.tech/slow", rel: "distributions" },
      ],
    } as Dataset);
    const { onDistributionError } = useDistributionCollection(dataset);
    const reportError = vi.fn();
    onDistributionError(reportError);

    await delay(10);
    dataset.value = {
      links: [
        { href: "http://services.dev.sgdi.tech/fast", rel: "distributions" },
      ],
    } as Dataset;
    await flushPromises();

    expect(reportError).not.toHaveBeenCalled();
  });
});

describe("useDistributionCollection 404", () => {
  const handlers = [
    http.get(
      "https://services.dev.sgdi.tech/api/oar/rc1/collections/swissgeo-distributions/items/ch.bafu.schutzgebiete-luftfahrt",
      () => {
        return HttpResponse.json("Not Found", { status: 404 });
      },
    ),
  ];
  const server = setupServer(...handlers);

  beforeAll(() => server.listen());

  afterAll(() => server.close());

  afterEach(() => server.resetHandlers());

  it("doesn't trip with 404", async () => {
    const dataset = ref(ChBafuSchutzgebieteLuftfahrt as Dataset);

    const { distributionCollection } = useDistributionCollection(dataset);

    expect(distributionCollection.value).toBe(null);
    await flushPromises();
    expect(distributionCollection.value).toEqual(null);
  });
});

describe("useDistributionCollection 5xx", () => {
  const handlers = [
    http.get(
      "https://services.dev.sgdi.tech/api/oar/rc1/collections/swissgeo-distributions/items/ch.bafu.schutzgebiete-luftfahrt",
      () => {
        return HttpResponse.error();
      },
    ),
  ];
  const server = setupServer(...handlers);

  beforeAll(() => server.listen());

  afterAll(() => server.close());

  afterEach(() => server.resetHandlers());

  it("doesn't trip with 5xx", async () => {
    const dataset = ref(ChBafuSchutzgebieteLuftfahrt as Dataset);

    const { distributionCollection } = useDistributionCollection(dataset);

    expect(distributionCollection.value).toBe(null);
    await flushPromises();
    expect(distributionCollection.value).toEqual(null);
  });
});

describe("extractDistributionLink", () => {
  it.each(["Distributions", "distributions", "dIstrIbUtions", "DISTRIBUTIONS"])(
    "works with random case distribution rels (%s)",
    (rel) => {
      const dataset = {
        links: [
          {
            rel,
            href: "my-link",
            title: "Distros",
          },
        ],
      };
      const link = extractDistributionLink(dataset);
      expect(link).toEqual("my-link");
    },
  );
});
