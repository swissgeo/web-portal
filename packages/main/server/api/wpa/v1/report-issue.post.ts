import log from "@swissgeo/log";
import { createError, readMultipartFormData } from "h3";

const FIELD_MAP: Record<string, string> = {
  subject: "subject",
  feedback: "feedback",
  category: "category",
  version: "version",
  ua: "ua",
  permalink: "permalink",
  email: "email",
};

const CATEGORY_MAP: Record<string, string> = {
  background: "background_map",
  thematic: "thematic_map",
  application: "application_service",
  other: "other",
};

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  if (!config.reportIssueServiceUrl) {
    throw createError({
      statusCode: 503,
      statusMessage: "Report issue service is not configured",
    });
  }

  const parts = await readMultipartFormData(event);

  if (!parts?.length) {
    throw createError({
      statusCode: 400,
      statusMessage: "Expected multipart/form-data request body",
    });
  }

  const formData = new FormData();

  for (const part of parts) {
    if (!part.name) {
      continue;
    }

    if (part.name === "attachment" && part.filename) {
      formData.append(
        "attachment",
        new Blob([new Uint8Array(part.data)], { type: part.type }),
        part.filename,
      );
    } else if (part.name in FIELD_MAP) {
      const serviceName = FIELD_MAP[part.name]!;
      const value = new TextDecoder().decode(part.data);
      const finalValue =
        part.name === "category" ? (CATEGORY_MAP[value] ?? value) : value;
      formData.append(serviceName, finalValue);
    }
  }

  try {
    const serviceUrl = new URL(config.reportIssueServiceUrl);
    const origin = `${serviceUrl.protocol}//${serviceUrl.host}`;

    const response = await $fetch(config.reportIssueServiceUrl, {
      method: "POST",
      headers: {
        accept: "application/json",
        origin,
        referer: `${origin}/`,
      },
      body: formData,
    });

    log.info(`Report issue upstream response: ${JSON.stringify(response)}`);

    return response;
  } catch (error) {
    log.error(`Report issue upstream error: ${String(error)}`);
    throw createError({
      statusCode: 500,
      statusMessage: "Error submitting report",
    });
  }
});
