import type { Dataset, DistributionCollection, Feature } from "@swissgeo/ogc";

import log from "@swissgeo/log";

import type { DatasetLayer, Layer, LayerInfo } from "@/index";

export class InvalidDatasetError extends Error {
  constructor(reason: string) {
    super(`Invalid dataset: ${reason}`);
    this.name = "InvalidDatasetError";
  }
}

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.length > 0;
};

/**
 * Structural validation of a Dataset, used before creating a layer from it.
 *
 * The Dataset type is produced by the backend OGC API, but the data can also
 * come from user-controlled sources (state sharing URLs, sessionStorage,
 * external fetches). This guards against passing something else (error
 * payloads, malformed JSON, stale/misshaped data) down the layer pipeline.
 */
export const validateDataset: (value: unknown) => asserts value is Dataset = (
  value,
) => {
  if (value === null || typeof value !== "object") {
    throw new InvalidDatasetError("value is not an object");
  }

  const candidate = value as Partial<Dataset>;

  if (!isNonEmptyString(candidate.id)) {
    throw new InvalidDatasetError('missing or empty "id"');
  }

  if (!candidate.properties || typeof candidate.properties !== "object") {
    throw new InvalidDatasetError('missing "properties"');
  }

  if (candidate.properties.type !== "Dataset") {
    throw new InvalidDatasetError(
      `"properties.type" must be "Dataset" (got ${JSON.stringify(candidate.properties.type)})`,
    );
  }

  if (!isNonEmptyString(candidate.properties.title)) {
    throw new InvalidDatasetError('missing or empty "properties.title"');
  }

  if (candidate.links !== undefined && !Array.isArray(candidate.links)) {
    throw new InvalidDatasetError('"links" must be an array when present');
  }

  const selfLink = candidate.links?.find((link) => link.rel === "self");
  if (!selfLink?.href) {
    throw new InvalidDatasetError('no "self" link with href');
  }
};

// only exported for testing purpose.
export const getInfoFromDataset = async (
  dataset: Dataset,
): Promise<LayerInfo> => {
  const properties = dataset.properties;
  const displayName = properties?.title;

  if (!properties || !displayName) {
    return {
      displayName: dataset.id,
    };
  }

  const contactOrganisation = properties.contacts?.[0]?.organization?.trim();
  const attributionName =
    contactOrganisation && contactOrganisation.length > 0
      ? contactOrganisation
      : properties.attribution;

  let attribution;
  if (attributionName) {
    attribution = {
      title: attributionName,
    };
  }

  const abstract = properties.description;

  const featureInfoInformation = await grabFeatureInfoInformation(dataset);
  return {
    // only add those if they're not undefined
    ...{ displayName },
    ...{ attribution },
    ...{ featureInfoInformation },
    abstract,
  };
};

export async function grabFeatureInfoInformation(dataset: Dataset) {
  const distributionLink = dataset.links?.find(
    (link) => link.rel.toLowerCase() === "distributions",
  )?.href;
  if (!distributionLink) {
    return;
  }
  const distributionRelResult = await fetch(distributionLink);
  if (distributionRelResult.status !== 200) {
    return;
  }

  const distributionCollection =
    (await distributionRelResult.json()) as DistributionCollection;

  const distributionRelJson =
    distributionCollection.features.find(
      (distribution) =>
        distribution.id === dataset.properties.preferredDistributionId,
    ) ?? distributionCollection.features[0];
  const featureInfoLink = distributionRelJson?.links?.find(
    (link) => link.rel.toLowerCase() === "featureinfo",
  )?.href;
  if (!featureInfoLink) {
    return;
  }
  const featureInfoRelResult = await fetch(featureInfoLink);
  if (featureInfoRelResult.status !== 200) {
    return;
  }
  const featureInfoRelJson =
    (await featureInfoRelResult.json()) as Feature<"featureinfo">;
  const protocol = featureInfoRelJson.properties?.protocol;
  const dataServiceLink = featureInfoRelJson.links.find(
    (link) => link.rel.toLowerCase() === "dataservice",
  )?.href;
  if (!dataServiceLink) {
    return;
  }
  const dataServiceRelResult = await fetch(dataServiceLink);
  if (dataServiceRelResult.status !== 200) {
    return;
  }
  const dataServiceRelJson =
    (await dataServiceRelResult.json()) as Feature<"dataservice">;
  const featureInfoBaseUrl =
    dataServiceRelJson.links?.find(
      (link) => link.rel.toLowerCase() === "describes",
    )?.href ??
    dataServiceRelJson.links.find(
      (link) => link.rel.toLowerCase() === "describedby",
    )?.href ??
    dataServiceRelJson.links.find((link) => link.rel.toLowerCase() === "about")
      ?.href;
  return {
    protocol,
    baseUrl: featureInfoBaseUrl,
  };
}

// Server layer fills properties like the Dataset
export const makeServerLayer = async (
  dataset: Dataset,
  options?: Partial<Layer>,
): Promise<Layer> => {
  log.debug(`Creating store layer from ${JSON.stringify(dataset)}`);

  validateDataset(dataset);

  // extract the self link from the dataset (validated above)
  const layerUrl = dataset.links.find((link) => link.rel === "self").href;

  return {
    layerUrl,
    type: "dataset",
    uuid: crypto.randomUUID(),
    humanId: dataset.id,
    data: dataset,
    isLoading: false,
    info: await getInfoFromDataset(dataset),
    ...options,
  };
};

export const isDatasetLayer = (layer: Layer): layer is DatasetLayer => {
  return layer.type === "dataset";
};
