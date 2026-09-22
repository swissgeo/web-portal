import type { WmtsLayer } from "@camptocamp/ogc-client";

import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

import type { Service } from "@/types";

import { useWmtsCapabilities } from "../useWmtsCapabilities";
import ChGeoadminWmts from "./fixtures/service_ch.admin.geo.wmts.json";

const { readiness } = vi.hoisted(() => ({ readiness: vi.fn() }));
beforeEach(() => readiness.mockReset());

vi.mock("@camptocamp/ogc-client", () => {
  function getLayerByName(name: string): WmtsLayer | undefined {
    if (name === "ch.bafu.landesforstinventar-vegetationshoehenmodell") {
      return {
        name,
        resourceLinks: [],
        styles: [],
        defaultStyle: "",
        matrixSets: [],
        dimensions: [
          { identifier: "Time", defaultValue: "current", values: [] },
        ],
      };
    }
    return {
      name,
      resourceLinks: [],
      styles: [],
      defaultStyle: "",
      matrixSets: [],
      dimensions: undefined,
    };
  }

  return {
    WmtsEndpoint: class {
      constructor(_url: string) {}
      isReady() {
        return readiness() ?? Promise.resolve({ getLayerByName });
      }
    },
  };
});

// ogc-client parsing the multi-MB capabilities fixture can exceed the default
// 5s timeout when the whole monorepo suite runs in parallel.
describe(
  "useWmtsCapabilities fetching and parsing WMTS capabilities",
  { timeout: 30_000 },
  () => {
    it("reports a pending request and its failure", async () => {
      let rejectRequest!: (reason: Error) => void;
      readiness.mockReturnValueOnce(
        new Promise((_resolve, reject) => {
          rejectRequest = reject;
        }),
      );
      const failure = new Error("Unavailable capabilities");
      const onError = vi.fn();
      const result = useWmtsCapabilities(
        ref<Service>(ChGeoadminWmts as Service),
        ref("layer"),
        onError,
      );
      await flushPromises();
      expect(result.isFetching.value).toBe(true);
      expect(result.error.value).toBeNull();
      rejectRequest(failure);
      await flushPromises();
      expect(result.isFetching.value).toBe(false);
      expect(result.error.value).toBe(failure);
      expect(onError).toHaveBeenCalledWith(failure);
    });

    it("parses the WMTS capabilities into an ogc-client endpoint", async () => {
      const service = ref<Service>(ChGeoadminWmts as Service);
      const layerId = ref("ch.bafu.radonkarte");

      const { capabilityUrl, wmtsData } = useWmtsCapabilities(service, layerId);
      expect(capabilityUrl.value).toEqual(
        "https://wmts.geo.admin.ch/EPSG/2056/1.0.0/WMTSCapabilities.xml",
      );

      // `wmtsData` is resolved asynchronously (computedAsync) once the endpoint
      // has fetched and parsed the capabilities.
      await vi.waitUntil(() => wmtsData.value !== null, { timeout: 5000 });
      await flushPromises();

      const endpoint = wmtsData.value?.endpoint;
      expect(endpoint).toBeDefined();
      expect(endpoint?.getLayerByName("ch.bafu.radonkarte")).toBeDefined();
    });

    it("exposes the dimensions of a layer that has dimensions", async () => {
      const service = ref<Service>(ChGeoadminWmts as Service);
      const layerId = ref(
        "ch.bafu.landesforstinventar-vegetationshoehenmodell",
      );

      const { wmtsData } = useWmtsCapabilities(service, layerId);
      await vi.waitUntil(() => wmtsData.value !== null, { timeout: 5000 });
      await flushPromises();

      const dimension = wmtsData.value?.dimensions?.[0];
      expect(dimension?.identifier).toEqual("Time");
      expect(dimension?.defaultValue).toEqual("current");
    });

    it("returns null dimensions for a layer that has none", async () => {
      const service = ref<Service>(ChGeoadminWmts as Service);
      const layerId = ref("ch.bafu.radonkarte");

      const { wmtsData } = useWmtsCapabilities(service, layerId);
      await vi.waitUntil(() => wmtsData.value !== null, { timeout: 5000 });
      await flushPromises();

      expect(wmtsData.value?.dimensions).toBeNull();
    });
  },
);
