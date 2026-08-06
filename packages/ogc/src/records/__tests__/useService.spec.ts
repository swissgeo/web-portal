import { flushPromises } from "@vue/test-utils";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { ref } from "vue";

import type { Distribution } from "@/types/Records";

import {
  useService,
  extractServiceUrl,
  getDataServiceLinks,
} from "../useService";
import ChBafuSchutzgebieteLuftfahrtWmts from "./fixtures/distribution_ch.bafu.schutzgebiete-luftfahrt_wmts.json";
import ChGeoadminWmts from "./fixtures/service_ch.admin.geo.wmts.json";

describe("useService fetching the service data from the OGC records", () => {
  const handlers = [
    http.get(
      "https://services.dev.sgdi.tech/api/oar/rc1/collections/geoadmin.services/items/ch.admin.geo.wmts",
      () => {
        return HttpResponse.json(ChGeoadminWmts);
      },
    ),
  ];
  const server = setupServer(...handlers);

  beforeAll(() => server.listen());

  afterAll(() => server.close());

  afterEach(() => server.resetHandlers());

  it("fetches the service data", async () => {
    const distribution = ref(ChBafuSchutzgebieteLuftfahrtWmts as Distribution);
    const { serviceData } = useService(distribution);

    await flushPromises();
    expect(serviceData.value).toEqual(ChGeoadminWmts);
  });

  it("fetches the service data after the distribution becomes available", async () => {
    const distribution = ref<Distribution | null>(null);
    const { serviceData } = useService(distribution);
    expect(serviceData.value).toBe(null);

    distribution.value = ChBafuSchutzgebieteLuftfahrtWmts as Distribution;
    await flushPromises();
    expect(serviceData.value).toEqual(ChGeoadminWmts);
  });

  it("returns null serviceUrl when distribution is null", () => {
    const distribution = ref<Distribution | null>(null);
    const { serviceUrl } = useService(distribution);
    expect(serviceUrl.value).toBe(null);
  });

  it("returns correct serviceUrl for a valid distribution", () => {
    const distribution = ref(ChBafuSchutzgebieteLuftfahrtWmts as Distribution);
    const { serviceUrl } = useService(distribution);
    expect(serviceUrl.value).toEqual(
      "https://services.dev.sgdi.tech/api/oar/rc1/collections/geoadmin.services/items/ch.admin.geo.wmts",
    );
  });
});

describe("extract service URL", () => {
  it("extracts the URL correctly", () => {
    const distribution = ChBafuSchutzgebieteLuftfahrtWmts as Distribution;
    const url = extractServiceUrl(distribution);
    expect(url).toEqual(
      "https://services.dev.sgdi.tech/api/oar/rc1/collections/geoadmin.services/items/ch.admin.geo.wmts",
    );
  });

  it("handles an empty distribution", () => {
    const distribution: null = null;
    const url = extractServiceUrl(distribution);
    expect(url).toBe(null);
  });

  it("handles an broken distribution", () => {
    const distribution = {
      links: [
        {
          href: "https://services.dev.sgdi.tech/api/oar/rc1/collections/geoadmin.services/items/ch.admin.geo.wmts",
        },
      ],
    };
    // @ts-expect-error Intentionally breaking the type
    const url = extractServiceUrl(distribution);
    expect(url).toBe(null);
  });

  it.each(["dataservice", "Dataservice", "DataSerVice", "DATASERVICE"])(
    "works with random case service rels (%s)",
    (rel) => {
      const dataset = {
        links: [
          {
            rel,
            href: "my-link",
          },
        ],
      };

      const link = extractServiceUrl(dataset);
      expect(link).toEqual("my-link");
    },
  );

  it("throws when links is undefined", () => {
    // @ts-expect-error Intentionally breaking the type
    const distribution = { links: undefined };
    expect(() => extractServiceUrl(distribution)).toThrow(
      "Unable to extract service URL",
    );
  });

  it("throws when dataservice link has no href", () => {
    const distribution = {
      links: [{ rel: "dataservice" }],
    };
    // @ts-expect-error Intentionally missing href
    expect(() => extractServiceUrl(distribution)).toThrow("Faulty wmts record");
  });
});

describe("getDataServiceLinks", () => {
  it("filters links by dataservice rel", () => {
    const links = [
      { href: "a", rel: "dataset" },
      { href: "b", rel: "dataservice" },
      { href: "c", rel: "styledby" },
      { href: "d", rel: "dataservice" },
    ];
    const result = getDataServiceLinks(links);
    expect(result).toEqual([
      { href: "b", rel: "dataservice" },
      { href: "d", rel: "dataservice" },
    ]);
  });

  it("returns empty array when no dataservice links", () => {
    const links = [
      { href: "a", rel: "dataset" },
      { href: "c", rel: "styledby" },
    ];
    const result = getDataServiceLinks(links);
    expect(result).toEqual([]);
  });
});
