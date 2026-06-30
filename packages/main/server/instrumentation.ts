import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-proto";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import * as opentelemetry from "@opentelemetry/sdk-node";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import log from "@swissgeo/log";
import process from "process";

const exporterOptions = {
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  ...(process.env.OTEL_EXPORTER_OTLP_HEADERS && {
    headers: Object.fromEntries(
      process.env.OTEL_EXPORTER_OTLP_HEADERS.split(",").map((header) => {
        const [key, value] = header.split("=");
        if (!key || !value) {
          throw new Error(`Invalid header format: ${header}`);
        }
        return [key.trim(), value.trim()];
      }),
    ),
  }),
};

const traceExporter = new OTLPTraceExporter(exporterOptions);

const metricExporter = new OTLPMetricExporter(exporterOptions);
const metricReader = new PeriodicExportingMetricReader({
  exporter: metricExporter,
});

const sdk = new opentelemetry.NodeSDK({
  traceExporter,
  metricReaders: [metricReader],
  instrumentations: [getNodeAutoInstrumentations()],
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || "web-portal",
  }),
});

sdk.start();

process.on("SIGTERM", () => {
  sdk
    .shutdown()
    .then(() => log.info("Tracing terminated"))
    .catch((error) => log.error("Error terminating tracing", error))
    .finally(() => process.exit(0));
});
