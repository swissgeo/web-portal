import type { FlatExtent } from "@swissgeo/shared";
import type { Geometry, GeometryCollection } from "geojson";

import log from "@swissgeo/log";

import type {
  FeatureData,
  LayerRequest,
  LayerSource,
  WMSLayerRequest,
} from "@/types";

import { FEATURE_LIMIT } from "@/constants";
import { useFeaturesStore } from "@/stores/feature";
import { sourcesToLayerRequests } from "@/utils/sourceToLayerRequest";

interface IdentifyResponse {
  results: Array<{
    id: string | number;
    geometry: Exclude<Geometry, GeometryCollection>;
  }>;
}

interface WmsGetFeatureInfoResponse {
  features?: Array<{
    type: "Feature";
    id?: string;
    properties?: Record<string, unknown> | null;
    geometry?: Exclude<Geometry, GeometryCollection> | null;
  }>;
}

export async function selectFeatures(
  extent: FlatExtent,
  epsgNumber: number,
  lang: string,
  layers: LayerSource[],
  limit: number = FEATURE_LIMIT,
  abortSignal?: AbortSignal,
): Promise<void> {
  // The WMS capability dict is read once per click.
  const requests = sourcesToLayerRequests(
    layers,
    useFeaturesStore().wmsCapabilitiesByUuid,
  );
  const results = await Promise.allSettled(
    requests.map((layerRequest) =>
      getFeaturesForOneLayer(
        layerRequest,
        extent,
        epsgNumber,
        lang,
        limit,
        abortSignal,
      ),
    ),
  );

  const storePayload: Record<string, FeatureData[]> = {};

  for (let i = 0; i < results.length; i++) {
    const result = results[i]!;
    const layer = layers[i]!;

    if (result.status === "fulfilled" && result.value.length > 0) {
      storePayload[layer.layerUuid] = result.value;
    } else if (result.status === "rejected") {
      const err = result.reason;
      log.error(err);
    }
  }

  useFeaturesStore().setSelection(storePayload);
}

// only exported for testing purpose, we only use identify outside this file
export async function getFeaturesForOneLayer(
  layerRequest: LayerRequest | WMSLayerRequest,
  extent: FlatExtent,
  epsgNumber: number,
  lang: string,
  limit: number,
  abortSignal?: AbortSignal,
): Promise<FeatureData[]> {
  // features are already part of the request, we don't do anything more than format everything.
  if (layerRequest.preResolvedFeatures) {
    return layerRequest.preResolvedFeatures.slice(0, limit).map((feature) => ({
      featureId: String(feature.id ?? crypto.randomUUID()),
      geometry: feature.geometry as Exclude<Geometry, GeometryCollection>,
      content: { kind: "json", properties: feature.properties ?? {} },
    }));

    // this means we've an identify url, we use an Identify here
  } else if (layerRequest.urlTemplate) {
    const baseUrl = `${layerRequest.urlTemplate.split("MapServer")[0]}MapServer/`;
    const identifyUrl = `${baseUrl}identify?layers=all:${layerRequest.layerId}&sr=${epsgNumber}&geometry=${extent.join(",")}&geometryFormat=geojson&geometryType=esriGeometryEnvelope&limit=${limit}&tolerance=0&returnGeometry=true&lang=${lang}`;
    const identifyResult = await fetch(identifyUrl, { signal: abortSignal });
    if (identifyResult.status !== 200) {
      log.warn(
        `[Identify Request]: getting a ${identifyResult.status} code when running identify on the layer ${layerRequest.layerId}`,
      );
      return [];
    }

    const identifyFeatures =
      ((await identifyResult.json()) as IdentifyResponse).results ?? [];

    return getFeaturesFromIds(
      identifyFeatures,
      layerRequest.urlTemplate,
      lang,
      abortSignal,
    );

    // last supported case: this is a wms layer which supports GetFeatureInfo
    // We skip layers that are not supported in our current projection.
  } else {
    return await getFeaturesFromWmsServer(
      layerRequest as WMSLayerRequest,
      epsgNumber,
      limit,
      lang,
      extent,
      abortSignal,
    );
  }
}

function pickFormat(formats: string[]): string | undefined {
  return formats.filter(
    (format) =>
      format === "application/json" || format.startsWith("application/json;"),
  )[0];
}

//version pattern
const versionPatterns = /^\d+\.\d+\.\d+$/;

//function to check if the version is older than 1.3.0
function lt130(version: string) {
  const base = [1, 3, 0];
  // the WMS version should be a valid version at this point, but we keep the security just in case.
  if (!versionPatterns.test(version)) {
    log.warn(
      `[WMS GetFeatureInfo Version] Version received (${version}) is not a valid version.`,
    );
    return;
  }
  const [major, minor, patch] = version
    .split(".")
    .map((num: string) => Number(num));
  return (
    major < base[0] ||
    (major === base[0] &&
      (minor < base[1] || (minor === base[1] && patch < base[2])))
  );
}

function buildWmsGetFeatureInfoUrl(
  wmsRequest: WMSLayerRequest,
  epsgNumber: number,
  featureLimit: number,
  lang: string,
  extent: FlatExtent,
  format: string,
): string {
  // base Params are always the same. We separated the version dependent params from the other variable
  // params to make it slightly easier to read. Version is in the version params because it feels right to
  // put it there :)
  const params: Record<string, string> = {
    SERVICE: "WMS",
    REQUEST: "GetFeatureInfo",
    WIDTH: "100",
    HEIGHT: "100",
    TOLERANCE: "10",
    BUFFER: "10",
    FI_POINT_TOLERANCE: "10",
    FI_LINE_TOLERANCE: "10",
    FI_POLYGON_TOLERANCE: "10",
    VERSION: versionPatterns.test(wmsRequest.wmsVersion)
      ? wmsRequest.wmsVersion
      : "1.3.0",
    LAYERS: wmsRequest.layerId,
    QUERY_LAYERS: wmsRequest.layerId,
    BBOX: extent.join(","),
    FEATURE_COUNT: String(featureLimit),
    LANG: lang,
    INFO_FORMAT: format,
  };
  if (lt130(params.VERSION)) {
    params["SRS"] = `EPSG:${epsgNumber}`;
    params["X"] = "50";
    params["Y"] = "50";
  } else {
    params["CRS"] = `EPSG:${epsgNumber}`;
    params["I"] = "50";
    params["J"] = "50";
  }

  // Real WMS OnlineResource hrefs usually end with a "?" or already carry
  // query params — naive string concatenation would produce a broken
  // "...??SERVICE=..." query. Normalizing through URL handles every shape.
  const url = new URL(wmsRequest.wmsGetFeatureInfo.baseUrl);
  url.search = new URLSearchParams(params).toString();
  return url.toString();
}

function getFeaturesFromIds(
  identifyFeatures: Array<{
    id: string | number;
    geometry: Exclude<Geometry, GeometryCollection>;
  }>,
  urlTemplate: string,
  lang: string,
  abortSignal?: AbortSignal,
) {
  return Promise.allSettled(
    identifyFeatures.map(async (feature): Promise<FeatureData> => {
      const popupUrl = urlTemplate!
        .replace("{featureId}", String(feature.id))
        .replace("{lang}", lang);
      const response = await fetch(popupUrl, { signal: abortSignal });
      return {
        featureId: String(feature.id),
        geometry: feature.geometry,
        content: {
          kind: "html",
          html: await response.text(),
          trusted: true,
        },
      };
    }),
  ).then((results) =>
    results
      .filter(
        (result): result is PromiseFulfilledResult<FeatureData> =>
          result.status === "fulfilled",
      )
      .map((result) => result.value),
  );
}

async function getFeaturesFromWmsServer(
  layerRequest: WMSLayerRequest,
  epsgNumber: number,
  limit: number,
  lang: string,
  extent: FlatExtent,
  abortSignal: AbortSignal,
) {
  const wmsRequest = layerRequest as WMSLayerRequest;
  if (!wmsRequest.wmsGetFeatureInfo || !wmsRequest.availableCrs) {
    log.debug(
      `[GetFeaturesForOneLayer] necessary information for GeatFeatureInfo for layer ${wmsRequest.layerId} is not sufficient`,
    );
    return [];
  }
  if (!wmsRequest.availableCrs.includes(`EPSG:${epsgNumber}`)) {
    log.debug(
      `[GetFeaturesForOneLayer] Layer ${wmsRequest.layerId} is not supported in the current projection.`,
    );
    return [];
  }
  const format = pickFormat(wmsRequest.wmsGetFeatureInfo.formats);
  if (!format) {
    log.debug(
      `[GetFeaturesForOneLayer] Unsupported format. No format in [${wmsRequest.wmsGetFeatureInfo.formats.join(",")}] supported. We are expecting application/json`,
    );
    return [];
  }

  const requestUrl = buildWmsGetFeatureInfoUrl(
    wmsRequest,
    epsgNumber,
    limit,
    lang,
    extent,
    format,
  );

  const featureInfoResult = await fetch(requestUrl, {
    signal: abortSignal,
    method: wmsRequest.wmsGetFeatureInfo.method,
  });
  if (featureInfoResult.status !== 200) {
    log.warn(
      `[GetFeatureInfo Request]: getting a ${featureInfoResult.status} code when running identify on the layer ${wmsRequest.layerId}`,
    );
    return [];
  }
  const body = (await featureInfoResult.json()) as WmsGetFeatureInfoResponse;
  // Only the GeoJSON FeatureCollection shape is supported. An unrecognized
  // shape is a warn + drop, an empty FeatureCollection is a normal silent [].
  if (!Array.isArray(body.features)) {
    log.warn(
      `[GetFeatureInfo Request]: unexpected response shape for layer ${wmsRequest.layerId} (expected a GeoJSON FeatureCollection)`,
    );
    return [];
  }
  const wmsFeatures: FeatureData[] = body.features.map((feature) => {
    const properties = feature.properties ?? {};
    return {
      featureId: String(
        feature.id ??
          properties.id ??
          properties.identifier ??
          properties.name ??
          properties.label ??
          crypto.randomUUID(),
      ),
      geometry: feature.geometry ?? null,
      content: {
        kind: "json",
        properties,
      },
    };
  });
  return wmsFeatures;
}
