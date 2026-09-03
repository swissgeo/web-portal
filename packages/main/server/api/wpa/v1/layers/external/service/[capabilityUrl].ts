import { appendResponseHeader, createError, getRouterParam } from "h3";

import { decodeCapabilityUrl } from "../../../../../../utils/externalLayerUrl";

export default defineEventHandler((event) => {
  const capabilityUrlParam = getRouterParam(event, "capabilityUrl");

  if (!capabilityUrlParam) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
      message: "Capability URL cannot be determined",
    });
  }

  const capabilityUrl = decodeCapabilityUrl(capabilityUrlParam);

  appendResponseHeader(event, "Content-Type", "application/json");
  appendResponseHeader(event, "Cache-Control", `max-age=${60 * 60}`);
  return {
    id: capabilityUrl,
    links: [
      {
        href: capabilityUrl,
        rel: "describedby",
        type: "application/xml",
        title: "Capability",
      },
    ],
  };
});
