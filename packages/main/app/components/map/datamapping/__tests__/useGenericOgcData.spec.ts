import type { DatasetLayer as DatasetLayerType } from "@swissgeo/layers";
import type { LayerFormat } from "@swissgeo/map";
import type {
  useDistributionCollection as useDistributionCollectionOriginal,
  useDistribution as useDistributionOriginal,
  usePreferredDistribution as usePreferredDistributionOriginal,
  Service,
  Distribution,
  DistributionCollection,
} from "@swissgeo/ogc";
import type { ComputedRef, ShallowRef } from "vue";

import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { ref } from "vue";

import { useGenericOgcData } from "../useGenericOgcData";

const layerMockData: Ref<DatasetLayerType> = ref({
  isVisible: true,
  isLoading: false,
  humanId: "fancy-mc-layer",
  type: "dataset",
  opacity: 1,
  uuid: "some-fancy-uuid",
  data: {
    id: "my-fancy-layer",
    links: [
      {
        rel: "distributions",
        href: "distribution-link",
      },
    ],
    properties: {
      preferredDistributionId: "favourite-distribution",
      title: "Fancy McLayer",
      type: "Dataset",
    },
  },
});

// MOCKING all the parts that are called by the composable from the OGC package
// the values as well as the mocked composables are returned, so that we can
// test the behaviour of the changes
// we mock and return the data as well as the composables themselves. The data
// is returned so that we can change the behaviour for the tests
const {
  onDistributionErrorMock,
  onDistributionResponseMock,
  onServiceErrorMock,
  onServiceResponseMock,
  distributionCollectionMockData,
  useDistributionCollectionMock,
  usePreferredDistributionMock,
  distributionMockData,
  useDistributionMock,
  useServiceMock,
  layerIdMockData,
  preferredDistributionIdMockData,
  serviceMockData,
  serviceUrlMockData,
} = await vi.hoisted(async () => {
  const { ref } = await import("vue");

  const distributionMockData = ref({
    id: "grossspuriges-heuchlerkraut:wmts",
    links: [
      {
        href: "link-to-service",
        rel: "service",
      },
    ],
    properties: {
      protocol: "ogc:wmts",
    },
  } as Distribution);

  //
  //  useDistributionCollection
  //
  const onDistributionErrorMock = vi.fn();
  const onDistributionResponseMock = vi.fn();
  const distributionCollectionMockData = ref({
    features: [distributionMockData.value],
    type: "FeatureCollection" as const,
    links: [],
  });
  const useDistributionCollectionMock = vi.fn(
    (): ReturnType<typeof useDistributionCollectionOriginal> => ({
      distributionCollection: distributionCollectionMockData,
      onDistributionError: onDistributionErrorMock,
      onDistributionResponse: onDistributionResponseMock,
    }),
  );

  //
  // usePreferredDistribution
  //
  const preferredDistributionIdMockData = ref(
    "grossspuriges-heuchlerkraut:wmts",
  );
  const usePreferredDistributionMock = vi.fn(
    (): ReturnType<typeof usePreferredDistributionOriginal> => ({
      preferredDistributionId: computed(
        () => preferredDistributionIdMockData.value,
      ),
    }),
  );

  //
  //  useDistribution
  //
  const layerIdMockData = ref("my-fancy-layer");
  const useDistributionMock = vi.fn(
    (): ReturnType<typeof useDistributionOriginal> => {
      return {
        distribution: computed(() => distributionMockData.value),
        layerId: computed(() => layerIdMockData.value),
      };
    },
  );

  //
  //  useService
  //
  const serviceMockData = ref<Service | null>({
    linkTemplates: [
      {
        uriTemplate: "uri is a canton in the heart of switzerland",
        rel: "about",
      },
    ],
  } as Service);
  const serviceUrlMockData = ref("http://servizi.it");
  const onServiceErrorMock = vi.fn();
  const onServiceResponseMock = vi.fn();

  const useServiceMock = vi.fn(() => ({
    serviceData: serviceMockData,
    serviceUrl: computed(() => serviceUrlMockData.value),
    onServiceError: onServiceErrorMock,
    onServiceResponse: onServiceResponseMock,
  }));

  return {
    onDistributionErrorMock,
    onDistributionResponseMock,
    onServiceErrorMock,
    onServiceResponseMock,
    distributionMockData,
    useDistributionCollectionMock,
    distributionCollectionMockData,

    preferredDistributionIdMockData,
    usePreferredDistributionMock,

    layerIdMockData,
    useDistributionMock,

    serviceMockData,
    serviceUrlMockData,
    useServiceMock,
  };
});

vi.mock("@swissgeo/ogc", () => ({
  usePreferredDistribution: usePreferredDistributionMock,
  useDistributionCollection: useDistributionCollectionMock,
  useDistribution: useDistributionMock,
  useService: useServiceMock,
}));

describe("useGenericOgcData ", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    distributionMockData.value = {
      id: "grossspuriges-heuchlerkraut:wmts",
      links: [{ href: "link-to-service", rel: "service" }],
      properties: { protocol: "ogc:wmts" },
    } as Distribution;
    distributionCollectionMockData.value.features = [
      distributionMockData.value,
    ];
    preferredDistributionIdMockData.value = "grossspuriges-heuchlerkraut:wmts";
    layerIdMockData.value = "my-fancy-layer";
    serviceUrlMockData.value = "http://servizi.it";
    serviceMockData.value = {
      linkTemplates: [{ uriTemplate: "uri", rel: "about" }],
    } as Service;
  });

  it.each([
    [
      "distribution",
      onDistributionErrorMock,
      "Unable to load required distribution",
    ],
    ["service", onServiceErrorMock, "Unable to load required OGC service"],
  ])("reports a %s request failure with its cause", (_, register, message) => {
    const onError = vi.fn();
    const cause = new Error("request failed");

    useGenericOgcData(layerMockData, onError);
    register.mock.calls[0]![0](cause);

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message, cause }),
    );
  });

  it.each([
    {
      message: "Dataset has no usable OGC distribution",
      prepare: () => {
        layerIdMockData.value = "";
      },
      register: onDistributionResponseMock,
    },
    {
      message: "Required OGC service URL is missing",
      prepare: () => {
        serviceUrlMockData.value = "";
      },
      register: onDistributionResponseMock,
    },
    {
      message: "Required OGC service result is unusable",
      prepare: () => {
        serviceMockData.value = null;
      },
      register: onServiceResponseMock,
    },
  ])("reports when $message", ({ message, prepare, register }) => {
    const onError = vi.fn();
    prepare();

    useGenericOgcData(layerMockData, onError);
    register.mock.calls[0]![0]();

    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message }));
  });

  it("calls the composables and returns data", async () => {
    const {
      distributionCollection,
      distribution,
      serviceData,
      layerFormat,
      layerId,
    } = useGenericOgcData(layerMockData, vi.fn());

    await flushPromises();

    expect(useDistributionCollectionMock).toHaveBeenCalledTimes(1);
    expectTypeOf(distributionCollection).toExtend<
      ShallowRef<DistributionCollection | null>
    >();
    expect(distributionCollection.value).toBeDefined();
    expect(distributionCollection.value).toHaveProperty("features", [
      distributionMockData.value,
    ]);

    expect(useDistributionMock).toHaveBeenCalledTimes(1);
    expectTypeOf(distribution).toExtend<ComputedRef<Distribution | null>>();
    expect(distribution.value).toBeDefined();

    expect(usePreferredDistributionMock).toHaveBeenCalledTimes(1);

    expect(useServiceMock).toHaveBeenCalledTimes(1);
    expectTypeOf(serviceData).toExtend<ShallowRef<Service | null>>();
    expect(serviceData.value).toBeDefined();

    expectTypeOf(layerFormat).toExtend<ComputedRef<LayerFormat | null>>();
    expect(layerFormat.value).toEqual("WMTS");

    expectTypeOf(layerId).toExtend<ComputedRef<string | null>>();
    expect(layerId.value).toEqual("my-fancy-layer");
  });

  it("updates the distribution when preferredDistributionId changes", async () => {
    // this is a use case where we test if the reactivity cascades
    const { distribution } = useGenericOgcData(layerMockData, vi.fn());
    await flushPromises();

    expect(distribution.value).toHaveProperty(
      "properties.protocol",
      "ogc:wmts",
    );

    distributionMockData.value = {
      id: "grossspuriges-heuchlerkraut:wms",
      links: [{ href: "link-to-service", rel: "service" }],
      properties: { protocol: "ogc:wms", title: "wms", type: "Distribution" },
    };
    preferredDistributionIdMockData.value = "grossspuriges-heuchlerkraut:wms";
    await flushPromises();

    expect(distribution.value).toHaveProperty("properties.protocol", "ogc:wms");
  });
});
