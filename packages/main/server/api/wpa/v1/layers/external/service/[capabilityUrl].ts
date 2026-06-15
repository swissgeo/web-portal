import { appendResponseHeader, createError, getRouterParam } from "h3";

export default defineEventHandler((event) => {
  const capabilityUrlParam = getRouterParam(event, "capabilityUrl");

  if (!capabilityUrlParam) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
      message: "Capability URL cannot be determined",
    });
  }

  const capabilityUrl = decodeURIComponent(capabilityUrlParam);

  appendResponseHeader(event, "Content-Type", "application/json");
  appendResponseHeader(event, "Cache-Control", `max-age=${60 * 60}`);
  return {
    id: capabilityUrl,
    links: [
      {
        href: capabilityUrl,
        rel: "about",
        type: "application/xml",
        title: "Capability",
      },
    ],
  };
});
