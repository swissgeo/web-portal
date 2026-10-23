import { decodeCapabilityUrl } from "~~/server/utils/externalLayerUrl";
import {
  appendResponseHeader,
  createError,
  getRouterParam,
  setResponseHeader,
} from "h3";

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
  setResponseHeader(event, "Cache-Control", "max-age=3600");
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
