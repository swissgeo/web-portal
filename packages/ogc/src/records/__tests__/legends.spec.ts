import type { WmtsLayer } from "@camptocamp/ogc-client";

import fs from "node:fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

import { parseWmsCapabilities } from "../useWmsCapabilities";
import { getLegends as getWmtsLegends } from "../useWmtsCapabilities";

const wmsCapabilitiesXML = fs.readFileSync(
  resolve(__dirname, "fixtures/capabilities_wms.geo.admin.ch.xml"),
  "utf-8",
);

/** A WMTS layer as ogc-client hands it over, trimmed to what legends need */
function makeWmtsLayer(styles: WmtsLayer["styles"]): WmtsLayer {
  return {
    name: "ch.agroscope.amphibien-ausbreitungskarten_alytes_obstetricans",
    resourceLinks: [],
    styles,
    defaultStyle: "default",
    matrixSets: [],
  };
}

describe("legend extraction from WMS capabilities", () => {
  it("extracts the legends of a layer", () => {
    const { legends } = parseWmsCapabilities(
      wmsCapabilitiesXML,
      "ch.vbs.armee-kriegsdenkmaeler",
    );

    expect(legends).toEqual([
      {
        href: "https://wms.geo.admin.ch/de/?version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=ch.vbs.armee-kriegsdenkmaeler&format=image/png&STYLE=default",
        format: "image/png",
        width: 186,
        height: 124,
      },
    ]);
  });

  // Layers are not always direct children of the root layer, and a layer can
  // advertise one legend per style
  it("extracts the legends of a layer nested in a group", () => {
    const { legends } = parseWmsCapabilities(
      wmsCapabilitiesXML,
      "ch.swisstopo.geologie-geomol_hoehe_top_dogger_legend",
    );

    expect(legends).toEqual([
      {
        href: "https://wms.geo.admin.ch/de/?version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=ch.swisstopo.geologie-geomol_hoehe_top_dogger_legend&format=image/png&STYLE=default",
        format: "image/png",
        width: 257,
        height: 39,
      },
      {
        href: "https://wms.geo.admin.ch/de/?version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=ch.swisstopo.geologie-geomol_hoehe_top_dogger&format=image/png&STYLE=default",
        format: "image/png",
        width: 257,
        height: 39,
      },
    ]);
  });

  it("returns no legend for an unknown layer", () => {
    const { legends } = parseWmsCapabilities(wmsCapabilitiesXML, "not.a.layer");

    expect(legends).toEqual([]);
  });

  it("returns no legend without capability data", () => {
    const { legends } = parseWmsCapabilities(
      null,
      "ch.vbs.armee-kriegsdenkmaeler",
    );

    expect(legends).toEqual([]);
  });
});

describe("legend extraction from a WMTS layer", () => {
  const href =
    "https://api3.geo.admin.ch/static/images/legends/ch.agroscope.amphibien-ausbreitungskarten_alytes_obstetricans_de.png";

  // WMTS capabilities advertise the URL alone, no format and no size
  it("extracts the legends of a layer", () => {
    const layer = makeWmtsLayer([
      { name: "default", title: "default", legendUrl: href },
    ]);

    expect(getWmtsLegends(layer)).toEqual([{ href }]);
  });

  it("skips the styles that advertise no legend", () => {
    const layer = makeWmtsLayer([
      { name: "default", title: "default", legendUrl: href },
      { name: "bare", title: "bare" },
    ]);

    expect(getWmtsLegends(layer)).toEqual([{ href }]);
  });

  it("returns no legend for a layer that was not found", () => {
    expect(getWmtsLegends(undefined)).toEqual([]);
  });
});
