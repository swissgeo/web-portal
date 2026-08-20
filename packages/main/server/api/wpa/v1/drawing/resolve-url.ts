import { createError, getQuery } from "h3";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const url = query.url as string;

  if (!url) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
      message: "URL parameter is required",
    });
  }

  try {
    const response = await fetch(url, {
      redirect: "manual",
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("Location");
      if (location) {
        const resolvedUrl = new URL(location, url).href;
        return { redirectUrl: resolvedUrl };
      }
    }

    throw createError({
      status: 404,
      statusMessage: "Not Found",
      message: "No redirect found",
    });
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      throw error;
    }
    throw createError({
      status: 500,
      statusMessage: "Internal Server Error",
      message: error instanceof Error ? error.message : "Failed to resolve URL",
    });
  }
});
