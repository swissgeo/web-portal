import type { WmtsLayer } from "@camptocamp/ogc-client";

import fs from "node:fs";
import { resolve } from "path";
import { beforeAll, describe, expect, it } from "vitest";

import {
  getLayer,
  getLegends as getWmsLegends,
  parseWmsCapabilities,
} from "../useWmsCapabilities";
import { getLegends as getWmtsLegends } from "../useWmtsCapabilities";

const wmsCapabilitiesXML = fs.readFileSync(
  resolve(__dirname, "fixtures/capabilities_wms.geo.admin.ch.xml"),
  "utf-8",
);

/**
 * The real geoadmin WMS capabilities are a couple of megabytes of XML, which
 * takes seconds to parse when the whole monorepo's tests run side by side. The
 * document is therefore parsed once, and only that hook gets the longer budget.
 */
const WMS_PARSE_TIMEOUT = 30000;

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
  let doc: Document;

  beforeAll(() => {
    doc = new DOMParser().parseFromString(wmsCapabilitiesXML, "text/xml");
  }, WMS_PARSE_TIMEOUT);

  it("extracts the legends of a layer", () => {
    expect(
      getWmsLegends(getLayer(doc, "ch.vbs.armee-kriegsdenkmaeler")!),
    ).toEqual([
      {
        href: "https://wms.geo.admin.ch/de/?version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=ch.vbs.armee-kriegsdenkmaeler&format=image/png&STYLE=default",
        format: "image/png",
        width: 186,
        height: 124,
      },
    ]);
  });

  // Layers are not always direct children of the root layer, and a nested layer
  // also inherits the legends its enclosing group advertises
  it("extracts the legends of a layer nested in a group", () => {
    expect(
      getWmsLegends(
        getLayer(doc, "ch.swisstopo.geologie-geomol_hoehe_top_dogger_legend")!,
      ),
    ).toEqual([
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
    expect(getWmsLegends(getLayer(doc, "not.a.layer")!)).toEqual([]);
  });

  it("returns no legend without capability data", () => {
    const { legends } = parseWmsCapabilities(
      null,
      "ch.vbs.armee-kriegsdenkmaeler",
    );

    expect(legends).toEqual([]);
  });
});

const legendGraphicBaseUrl =
  "https://wfs.geodienste.ch/gefahrenkarten_v1_3_0/deu?";

const legendGraphicRequest = `
  <sld:GetLegendGraphic>
    <Format>image/png</Format>
    <DCPType><HTTP><Get>
      <OnlineResource xlink:href="${legendGraphicBaseUrl}"/>
    </Get></HTTP></DCPType>
  </sld:GetLegendGraphic>`;

/**
 * Trimmed geodienste.ch capabilities. The XML declaration is left out, because
 * happy-dom rejects a declaration with single quotes.
 */
function makeGroupCapabilities(request: string): string {
  return `<WMS_Capabilities version="1.3.0" xmlns="http://www.opengis.net/wms" xmlns:sld="http://www.opengis.net/sld" xmlns:xlink="http://www.w3.org/1999/xlink">
  <Capability>
    <Request>${request}</Request>
    <Layer>
      <Title>root</Title>
      <Layer>
        <Name>synoptische_gefahrenuebersicht</Name>
        <Layer><Name>synoptisches_gefahrengebiet</Name></Layer>
      </Layer>
      <Layer>
        <Name>group_with_legend</Name>
        <Style>
          <Name>default</Name>
          <LegendURL width="10" height="20">
            <Format>image/png</Format>
            <OnlineResource xlink:href="https://example.com/legend.png"/>
          </LegendURL>
        </Style>
        <Layer><Name>child_of_group_with_legend</Name></Layer>
      </Layer>
      <Layer><Name>leaf_without_legend</Name></Layer>
    </Layer>
  </Capability>
</WMS_Capabilities>`;
}

describe("legend of a group layer without advertised legend", () => {
  it.each`
    case                                        | request                 | layerId                             | expected
    ${"requests GetLegendGraphic for a group"}  | ${legendGraphicRequest} | ${"synoptische_gefahrenuebersicht"} | ${[{ href: `${legendGraphicBaseUrl}SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&SLD_VERSION=1.1.0&LAYER=synoptische_gefahrenuebersicht&FORMAT=image%2Fpng`, format: "image/png" }]}
    ${"keeps the advertised legend of a group"} | ${legendGraphicRequest} | ${"group_with_legend"}              | ${[{ href: "https://example.com/legend.png", format: "image/png", width: 10, height: 20 }]}
    ${"gives no legend to a leaf layer"}        | ${legendGraphicRequest} | ${"leaf_without_legend"}            | ${[]}
    ${"needs an advertised GetLegendGraphic"}   | ${""}                   | ${"synoptische_gefahrenuebersicht"} | ${[]}
  `("$case", ({ request, layerId, expected }) => {
    const { legends } = parseWmsCapabilities(
      makeGroupCapabilities(request),
      layerId,
    );

    expect(legends).toEqual(expected);
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
