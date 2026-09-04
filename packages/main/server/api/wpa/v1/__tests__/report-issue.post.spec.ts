import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const readMultipartFormDataMock = vi.fn();

vi.stubGlobal("defineEventHandler", (handler: unknown) => handler);

const createErrorMock = vi.fn(
  (opts: { statusCode: number; statusMessage: string }) => {
    const error = new Error(opts.statusMessage) as Error & {
      statusCode: number;
      statusMessage: string;
    };
    error.statusCode = opts.statusCode;
    error.statusMessage = opts.statusMessage;
    return error;
  },
);

let runtimeConfig: { reportIssueServiceUrl: string } = {
  reportIssueServiceUrl: "https://report.example.test/submit",
};

mockNuxtImport("useRuntimeConfig", () => () => runtimeConfig);

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }));

vi.mock("h3", async () => {
  const actual = await vi.importActual("h3");
  return {
    ...actual,
    readMultipartFormData: (...args: unknown[]) =>
      readMultipartFormDataMock(...args),
    createError: createErrorMock,
  };
});

vi.mock("@swissgeo/log", () => ({
  default: { error: vi.fn(), info: vi.fn() },
}));

mockNuxtImport("$fetch", () => fetchMock);

const handlerPromise = import("../report-issue.post").then(
  ({ default: handler }) => handler,
);

beforeEach(() => {
  readMultipartFormDataMock.mockReset();
  fetchMock.mockReset();
  createErrorMock.mockClear();
  runtimeConfig = {
    reportIssueServiceUrl: "https://report.example.test/submit",
  };
});

afterAll(() => {
  vi.unstubAllGlobals();
});

function textPart(name: string, value: string) {
  return {
    name,
    data: new TextEncoder().encode(value),
  };
}

function filePart(
  name: string,
  filename: string,
  content: string,
  type: string,
) {
  return {
    name,
    filename,
    type,
    data: new TextEncoder().encode(content),
  };
}

describe("report issue proxy", () => {
  it("throws 503 when reportIssueServiceUrl is not configured", async () => {
    runtimeConfig.reportIssueServiceUrl = "";
    readMultipartFormDataMock.mockResolvedValue([
      textPart("feedback", "hello"),
    ]);

    const handler = await handlerPromise;

    await expect(handler({} as never)).rejects.toMatchObject({
      statusCode: 503,
      statusMessage: "Report issue service is not configured",
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws 400 when no multipart parts are returned", async () => {
    readMultipartFormDataMock.mockResolvedValue(null);

    const handler = await handlerPromise;

    await expect(handler({} as never)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: "Expected multipart/form-data request body",
    });
  });

  it("throws 400 when multipart parts array is empty", async () => {
    readMultipartFormDataMock.mockResolvedValue([]);

    const handler = await handlerPromise;

    await expect(handler({} as never)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: "Expected multipart/form-data request body",
    });
  });

  it("forwards text fields to the upstream service", async () => {
    readMultipartFormDataMock.mockResolvedValue([
      textPart("subject", "[Problem Report]"),
      textPart("feedback", "Broken layer"),
      textPart("category", "thematic"),
      textPart("version", "abc1234"),
      textPart("ua", "Mozilla/5.0"),
      textPart("permalink", "https://map.geo.admin.ch/?state=abc"),
      textPart("email", "test@example.com"),
    ]);
    fetchMock.mockResolvedValue({ ok: true });

    const handler = await handlerPromise;
    const result = await handler({} as never);

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0] as [
      string,
      { method: string; headers: Record<string, string>; body: FormData },
    ];
    expect(url).toBe("https://report.example.test/submit");
    expect(options.method).toBe("POST");
    expect(options.headers.accept).toBe("application/json");
    expect(options.headers.origin).toBe("https://report.example.test");
    expect(options.headers.referer).toBe("https://report.example.test/");

    const body = options.body as FormData;
    expect(body.get("subject")).toBe("[Problem Report]");
    expect(body.get("feedback")).toBe("Broken layer");
    expect(body.get("category")).toBe("thematic_map");
    expect(body.get("version")).toBe("abc1234");
    expect(body.get("ua")).toBe("Mozilla/5.0");
    expect(body.get("permalink")).toBe("https://map.geo.admin.ch/?state=abc");
    expect(body.get("email")).toBe("test@example.com");

    expect(result).toEqual({ ok: true });
  });

  it("maps all category values to service format", async () => {
    const categories: Array<[string, string]> = [
      ["background", "background_map"],
      ["thematic", "thematic_map"],
      ["application", "application_service"],
      ["other", "other"],
    ];

    for (const [frontend, service] of categories) {
      readMultipartFormDataMock.mockResolvedValue([
        textPart("category", frontend),
      ]);
      fetchMock.mockResolvedValue({ ok: true });

      const handler = await handlerPromise;
      await handler({} as never);

      const body = fetchMock.mock.calls.at(-1)![1].body as FormData;
      expect(body.get("category")).toBe(service);
    }
  });

  it("passes through unmapped category values unchanged", async () => {
    readMultipartFormDataMock.mockResolvedValue([
      textPart("category", "new_future_category"),
    ]);
    fetchMock.mockResolvedValue({ ok: true });

    const handler = await handlerPromise;
    await handler({} as never);

    const body = fetchMock.mock.calls[0][1].body as FormData;
    expect(body.get("category")).toBe("new_future_category");
  });

  it("forwards file attachment as a Blob", async () => {
    readMultipartFormDataMock.mockResolvedValue([
      textPart("feedback", "see attached"),
      textPart("category", "application"),
      filePart("attachment", "screenshot.png", "fake-png-data", "image/png"),
    ]);
    fetchMock.mockResolvedValue({ ok: true });

    const handler = await handlerPromise;
    await handler({} as never);

    const body = fetchMock.mock.calls[0][1].body as FormData;
    const attachment = body.get("attachment");

    expect(attachment).toBeInstanceOf(Blob);
    expect((attachment as Blob).type).toBe("image/png");
  });

  it("skips parts with no name", async () => {
    readMultipartFormDataMock.mockResolvedValue([
      { name: undefined, data: new TextEncoder().encode("noise") },
      textPart("feedback", "valid"),
      textPart("category", "other"),
    ]);
    fetchMock.mockResolvedValue({ ok: true });

    const handler = await handlerPromise;
    await handler({} as never);

    const body = fetchMock.mock.calls[0][1].body as FormData;
    expect(body.get("feedback")).toBe("valid");
    expect(body.get("category")).toBe("other");
  });

  it("skips unknown field names", async () => {
    readMultipartFormDataMock.mockResolvedValue([
      textPart("feedback", "text"),
      textPart("category", "other"),
      textPart("unknownField", "ignored"),
    ]);
    fetchMock.mockResolvedValue({ ok: true });

    const handler = await handlerPromise;
    await handler({} as never);

    const body = fetchMock.mock.calls[0][1].body as FormData;
    expect(body.has("unknownField")).toBe(false);
  });

  it("throws 500 when upstream request fails", async () => {
    readMultipartFormDataMock.mockResolvedValue([
      textPart("feedback", "text"),
      textPart("category", "other"),
    ]);
    fetchMock.mockRejectedValue(new Error("upstream timeout"));

    const handler = await handlerPromise;

    await expect(handler({} as never)).rejects.toMatchObject({
      statusCode: 500,
      statusMessage: "Error submitting report",
    });
  });

  it("sends to the configured service URL", async () => {
    readMultipartFormDataMock.mockResolvedValue([
      textPart("feedback", "text"),
      textPart("category", "other"),
    ]);
    fetchMock.mockResolvedValue({ ok: true });

    const handler = await handlerPromise;
    await handler({} as never);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://report.example.test/submit",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
