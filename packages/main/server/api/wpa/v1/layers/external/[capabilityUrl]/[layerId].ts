import { appendResponseHeader, createError, getRouterParam } from "h3";

import { decodeCapabilityUrl } from "../../../../../../utils/externalLayerUrl";

export default defineEventHandler((event) => {
  const capabilityUrlParam = getRouterParam(event, "capabilityUrl");
  const layerId = getRouterParam(event, "layerId");

  if (!capabilityUrlParam || !layerId) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
      message: "Capability URL and Layer ID are required",
    });
  }

  const capabilityUrl = decodeCapabilityUrl(capabilityUrlParam);
  const serviceUrl = `/api/wpa/v1/layers/external/service/${capabilityUrlParam}`;

  // Determine protocol based on the capability URL
  let protocol = "OGC:WMTS";
  if (capabilityUrl.toLowerCase().includes("wms")) {
    protocol = "OGC:WMS";
  }

  appendResponseHeader(event, "Content-Type", "application/json");
  appendResponseHeader(event, "Cache-Control", `max-age=${60 * 60}`);
  return {
    type: "FeatureCollection",
    links: [],
    features: [
      {
        id: `${layerId}`,
        links: [
          {
            href: serviceUrl,
            // the pipeline resolves the service via rel "dataservice"
            // (getDataServiceLinks), not "service"
            rel: "dataservice",
          },
        ],
        properties: {
          title: layerId,
          type: "Distribution",
          protocol,
          externalIds: [layerId],
        },
      },
    ],
  };
});
