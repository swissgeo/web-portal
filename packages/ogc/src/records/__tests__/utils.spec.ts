import { describe, expect, it } from "vitest";

import { replaceTemplateVarsWithDefaults } from "../utils";

describe("replace link template utility", () => {
  it("correctly replaces enum type variable with default", () => {
    const linkTemplate = {
      uriTemplate:
        "https://wmts.geo.admin.ch/EPSG/{epsg}/1.0.0/WMTSCapabilities.xml",
      rel: "about",
      title: "WMTS Capabilities File",
      type: "application/xml",
      variables: {
        epsg: {
          enum: [2056, 21781, 4326],
          type: "number",
          format: "integer",
          default: 2056,
          description: "EPSG",
        },
      },
    };

    expect(replaceTemplateVarsWithDefaults(linkTemplate)).toEqual(
      "https://wmts.geo.admin.ch/EPSG/2056/1.0.0/WMTSCapabilities.xml",
    );
  });

  it("correctly replaces enum type variable without default", () => {
    const linkTemplate = {
      uriTemplate:
        "https://wmts.geo.admin.ch/EPSG/{epsg}/1.0.0/WMTSCapabilities.xml",
      rel: "about",
      title: "WMTS Capabilities File",
      type: "application/xml",
      variables: {
        epsg: {
          enum: [2056, 21781, 4326],
          type: "number",
          format: "integer",
          description: "EPSG",
        },
      },
    };

    expect(replaceTemplateVarsWithDefaults(linkTemplate)).toEqual(
      "https://wmts.geo.admin.ch/EPSG/2056/1.0.0/WMTSCapabilities.xml",
    );
  });

  it("throws an error when both enum and default are missing", () => {
    const linkTemplate = {
      uriTemplate:
        "https://wmts.geo.admin.ch/EPSG/{epsg}/1.0.0/WMTSCapabilities.xml",
      rel: "about",
      title: "WMTS Capabilities File",
      type: "application/xml",
      variables: {
        epsg: {
          type: "number",
          format: "integer",
          description: "EPSG",
        },
      },
    };

    expect(() => replaceTemplateVarsWithDefaults(linkTemplate)).toThrow();
  });

  it("replaces multiple variables correctly", () => {
    const linkTemplate = {
      uriTemplate:
        "https://wms.geo.admin.ch/?SERVICE=WMS&REQUEST=GetCapabilities&VERSION={version}&FORMAT={format}&lang={lang}",
      rel: "about",
      type: "application/xml",
      title: "WMS Capabilities File",
      variables: {
        lang: {
          description: "Language",
          type: "string",
          default: "en",
          enum: ["de", "fr", "en", "it"],
        },
        format: {
          description: "Format",
          type: "string",
          default: "text/html",
          enum: ["text/html", "application/json"],
        },
        version: {
          description: "Version",
          type: "string",
          enum: ["1.3.0", "1.3.3.7"],
        },
      },
    };

    expect(replaceTemplateVarsWithDefaults(linkTemplate)).toEqual(
      "https://wms.geo.admin.ch/?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0&FORMAT=text/html&lang=en",
    );
  });
});
