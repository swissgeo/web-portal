import log from "@swissgeo/log";
import { createError, readMultipartFormData } from "h3";

const REPORT_ISSUE_FIELDS = [
  "subject",
  "feedback",
  "category",
  "version",
  "ua",
  "permalink",
  "email",
] as const;

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
    } else if (
      REPORT_ISSUE_FIELDS.includes(
        part.name as (typeof REPORT_ISSUE_FIELDS)[number],
      )
    ) {
      formData.append(part.name, new TextDecoder().decode(part.data));
    }
  }

  try {
    const response = await $fetch(config.reportIssueServiceUrl, {
      method: "POST",
      body: formData,
    });

    return response;
  } catch (error) {
    log.error(`Report issue upstream error: ${String(error)}`);
    throw createError({
      statusCode: 500,
      statusMessage: "Error submitting report",
    });
  }
});
