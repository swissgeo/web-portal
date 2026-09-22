import type { Distribution } from "@swissgeo/ogc";

import { mountSuspended } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import DatasetService from "../DatasetService.vue";
import DatasetServiceList from "../DatasetServiceList.vue";

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }));
vi.mock("#build/fetch", () => ({ $fetch: fetchMock }));

let sequence = 0;
const unmounts: (() => void)[] = [];

function distribution(
  href = `https://example.test/service/${++sequence}`,
): Distribution {
  return {
    id: `layer-${++sequence}`,
    properties: {
      type: "Distribution",
      title: "Data layer",
      protocol: "ogc:wms",
      externalIds: ["provider.layer"],
    },
    links: [{ rel: "dataservice", href }],
  };
}

function service(href: string) {
  return { links: [{ rel: "describedby", href }] };
}

async function mountRow(record: Distribution) {
  const wrapper = await mountSuspended(DatasetService, {
    props: { distribution: record },
  });
  unmounts.push(() => wrapper.unmount());
  await flushPromises();
  return wrapper;
}

beforeEach(() => {
  fetchMock.mockReset();
});
afterEach(() => {
  unmounts.splice(0).forEach((unmount) => {
    unmount();
  });
});

describe("dataset service addresses", () => {
  it("opens the STAC browser for the supplied collection ID", async () => {
    const record = distribution();
    record.properties.protocol = "ogcapi:stac";
    record.properties.externalIds = ["different.collection"];
    fetchMock
      .mockResolvedValueOnce(service("https://example.test/stac/"))
      .mockResolvedValueOnce({
        links: [{ rel: "data", href: "./collections?key=public" }],
      })
      .mockResolvedValueOnce({
        links: [
          {
            rel: "alternate",
            type: "text/html",
            href: "https://browser.example.test/collections/different.collection",
          },
        ],
      });
    const wrapper = await mountRow(record);

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      record.links?.[0]?.href,
      "https://example.test/stac/",
      "https://example.test/stac/collections/different.collection?key=public",
    ]);
    expect(wrapper.get("a").attributes("href")).toBe(
      "https://browser.example.test/collections/different.collection",
    );
    expect(wrapper.text()).toContain("STAC");
    expect(
      fetchMock.mock.calls.every(([, options]) => options.retry === 0),
    ).toBe(true);
  });

  it("omits the STAC action when the collection has no browser link", async () => {
    const record = distribution();
    record.properties.protocol = "ogcapi:stac";
    fetchMock
      .mockResolvedValueOnce(service("https://example.test/no-browser/"))
      .mockResolvedValueOnce({
        links: [{ rel: "data", href: "./collections" }],
      })
      .mockResolvedValueOnce({
        links: [
          {
            rel: "license",
            type: "text/html",
            href: "https://example.test/license",
          },
        ],
      });
    const wrapper = await mountRow(record);

    expect(wrapper.find("a").exists()).toBe(false);
    expect(wrapper.find('[role="status"]').exists()).toBe(false);
  });

  it("shows a failed STAC collection request as an error", async () => {
    const record = distribution();
    record.properties.protocol = "ogcapi:stac";
    fetchMock
      .mockResolvedValueOnce(service("https://example.test/failing-stac/"))
      .mockResolvedValueOnce({
        links: [{ rel: "data", href: "./collections" }],
      })
      .mockRejectedValueOnce(new Error("Collection unavailable"));
    const wrapper = await mountRow(record);

    expect(wrapper.get('[role="status"]').classes()).toContain("text-error");
    expect(wrapper.find("a").exists()).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it.each([{ ids: [] }, { ids: ["first", "second"] }])(
    "does not guess a STAC collection from %j",
    async ({ ids }) => {
      const record = distribution();
      record.properties.protocol = "ogcapi:stac";
      record.properties.externalIds = ids;
      fetchMock.mockResolvedValueOnce(service("https://example.test/stac/"));
      const wrapper = await mountRow(record);

      expect(wrapper.find("a").exists()).toBe(false);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );

  it("opens the complete capabilities address and shows the provider layer ID", async () => {
    const address =
      "https://example.test/wms?SERVICE=WMS&REQUEST=GetCapabilities&lang=fr#capabilities";
    fetchMock.mockResolvedValue(service(address));
    const record = distribution();
    const wrapper = await mountRow(record);

    expect(wrapper.get("a").attributes("href")).toBe(address);
    expect(wrapper.get("a").attributes("target")).toBe("_blank");
    expect(wrapper.text()).toContain("WMS");
    expect(wrapper.text()).toContain("provider.layer");
    expect(fetchMock).toHaveBeenCalledWith(
      record.links?.[0]?.href,
      expect.objectContaining({ retry: 0 }),
    );
  });

  it("resolves relative links against their source records", async () => {
    const record = distribution(`../services/${++sequence}`);
    record.links?.push({
      rel: "self",
      href: "https://example.test/distributions/record",
    });
    fetchMock.mockResolvedValue(service("./capabilities?token=public"));
    const wrapper = await mountRow(record);

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      new URL(
        record.links?.[0]?.href ?? "",
        "https://example.test/distributions/record",
      ).href,
    );
    expect(wrapper.get("a").attributes("href")).toBe(
      "https://example.test/services/capabilities?token=public",
    );
  });

  it("does not request a missing or unsafe service URL", async () => {
    const missing = distribution();
    missing.links = [];
    const first = await mountRow(missing);
    const second = await mountRow(distribution("javascript:alert(1)"));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(first.find("a").exists()).toBe(false);
    expect(second.find("a").exists()).toBe(false);
  });

  it("starts when a service becomes available and clears it when the link disappears", async () => {
    const missing = distribution();
    missing.links = [];
    const wrapper = await mountRow(missing);
    expect(fetchMock).not.toHaveBeenCalled();

    fetchMock.mockResolvedValue(
      service("https://example.test/available-capabilities"),
    );
    await wrapper.setProps({ distribution: distribution() });
    await flushPromises();
    expect(wrapper.get("a").attributes("href")).toBe(
      "https://example.test/available-capabilities",
    );

    await wrapper.setProps({ distribution: missing });
    await flushPromises();
    expect(wrapper.find("a").exists()).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("omits unsafe capabilities links", async () => {
    fetchMock.mockResolvedValue(service("javascript:alert(1)"));
    const wrapper = await mountRow(distribution());
    expect(wrapper.find("a").exists()).toBe(false);
  });

  it("uses supplied template defaults for the capabilities address", async () => {
    fetchMock.mockResolvedValue({
      linkTemplates: [
        {
          rel: "describedby",
          uriTemplate: "https://example.test/{language}/capabilities",
          variables: { language: { default: "de" } },
        },
      ],
    });
    const wrapper = await mountRow(distribution());
    expect(wrapper.get("a").attributes("href")).toBe(
      "https://example.test/de/capabilities",
    );
  });

  it("keeps an incomplete capabilities template failure inside the row", async () => {
    fetchMock.mockResolvedValue({
      linkTemplates: [
        {
          rel: "describedby",
          uriTemplate: "https://example.test/{language}/capabilities",
          variables: { language: {} },
        },
      ],
    });
    const wrapper = await mountRow(distribution());
    expect(wrapper.get('[role="status"]').classes()).toContain("text-error");
    expect(wrapper.find("a").exists()).toBe(false);
  });

  it("omits an address when the service supplies no capabilities link", async () => {
    fetchMock.mockResolvedValue({ links: [] });
    const wrapper = await mountRow(distribution());
    expect(wrapper.find("a").exists()).toBe(false);
    expect(wrapper.find('[role="status"]').exists()).toBe(false);
  });

  it("shows a local failure without a retry control", async () => {
    fetchMock.mockRejectedValue(new Error("Service unavailable"));
    const wrapper = await mountRow(distribution());

    expect(wrapper.get('[role="status"]').text()).not.toBe("");
    expect(wrapper.find("a").exists()).toBe(false);
    expect(wrapper.find("button").exists()).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shares one request between layers using the same service", async () => {
    let resolveService: (_value: ReturnType<typeof service>) => void = () => {};
    fetchMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveService = resolve;
        }),
    );
    const first = distribution();
    const second = { ...first, id: "second-layer" };
    const wrapper = await mountSuspended(DatasetServiceList, {
      props: { distributions: [first, second] },
    });
    unmounts.push(() => wrapper.unmount());
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(wrapper.findAll('[role="status"]')).toHaveLength(2);
    resolveService(service("https://example.test/shared-capabilities"));
    await flushPromises();
    expect(wrapper.findAll("a")).toHaveLength(2);
  });

  it("does not show an old service address after the distribution changes", async () => {
    let resolveOld: (_value: ReturnType<typeof service>) => void = () => {};
    fetchMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveOld = resolve;
        }),
    );
    const wrapper = await mountRow(distribution());
    expect(wrapper.find("a").exists()).toBe(false);

    fetchMock.mockResolvedValueOnce(
      service("https://example.test/new-capabilities"),
    );
    await wrapper.setProps({ distribution: distribution() });
    await flushPromises();
    resolveOld(service("https://example.test/old-capabilities"));
    await flushPromises();

    expect(wrapper.get("a").attributes("href")).toBe(
      "https://example.test/new-capabilities",
    );
  });
});
