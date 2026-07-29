import { context } from "@opentelemetry/api";
import { logs, SeverityNumber } from "@opentelemetry/api-logs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import log, { LogLevel, LogPreDefinedColor } from "./index";
import { Message } from "./Message";

const loggerMock = {
  emit: vi.fn(),
  enabled: vi.fn(() => true),
};

beforeEach(() => {
  loggerMock.emit.mockReset();
  vi.spyOn(logs, "getLogger").mockReturnValue(loggerMock);
  log.wantedLevels = [LogLevel.Error, LogLevel.Warn];
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "debug").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("log", () => {
  it("does not write disabled log levels", () => {
    log.wantedLevels = [];

    log.error("hidden");

    expect(console.error).not.toHaveBeenCalled();
    expect(loggerMock.emit).not.toHaveBeenCalled();
  });

  it.each([
    {
      label: "error",
      level: LogLevel.Error,
      write: () => log.error("message"),
      consoleMethod: "error",
      severity: SeverityNumber.ERROR,
    },
    {
      label: "warning",
      level: LogLevel.Warn,
      write: () => log.warn("message"),
      consoleMethod: "warn",
      severity: SeverityNumber.WARN,
    },
    {
      label: "information",
      level: LogLevel.Info,
      write: () => log.info("message"),
      consoleMethod: "info",
      severity: SeverityNumber.INFO,
    },
    {
      label: "debug",
      level: LogLevel.Debug,
      write: () => log.debug("message"),
      consoleMethod: "debug",
      severity: SeverityNumber.DEBUG,
    },
  ] as const)(
    "routes $label messages to the console and telemetry",
    ({ level, write, consoleMethod, severity }) => {
      log.wantedLevels = [level];

      write();

      expect(console[consoleMethod]).toHaveBeenCalledWith("message");
      expect(loggerMock.emit).toHaveBeenCalledWith({
        severityNumber: severity,
        severityText: LogLevel[level],
        body: "message",
        attributes: undefined,
        context: context.active(),
      });
    },
  );

  it("formats structured messages for the console and telemetry", () => {
    const message = new Message("dataset.loaded", { count: 2 });
    log.wantedLevels = [LogLevel.Info];

    log.info({
      title: "Catalog",
      titleColor: LogPreDefinedColor.Blue,
      messages: ["Loaded", message],
    });

    expect(console.info).toHaveBeenCalledWith(
      "%c[Catalog]%c",
      expect.stringContaining(LogPreDefinedColor.Blue),
      "",
      "Loaded",
      message,
    );
    expect(loggerMock.emit).toHaveBeenCalledWith({
      severityNumber: SeverityNumber.INFO,
      severityText: "Info",
      body: "[Catalog] Loaded dataset.loaded",
      attributes: { count: 2 },
      context: context.active(),
    });
  });

  it("emits standalone message parameters as telemetry attributes", () => {
    const message = new Message("request.failed", { status: 503 });

    log.warn(message);

    expect(console.warn).toHaveBeenCalledWith(message);
    expect(loggerMock.emit).toHaveBeenCalledWith({
      severityNumber: SeverityNumber.WARN,
      severityText: "Warn",
      body: "request.failed",
      attributes: { status: 503 },
      context: context.active(),
    });
  });
});
