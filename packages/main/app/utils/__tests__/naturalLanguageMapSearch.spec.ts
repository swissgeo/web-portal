import { describe, expect, it } from "vitest";

import type { NaturalLanguageCatalogRecord } from "../naturalLanguageMapSearch";

import {
  expandLayerQuery,
  extractPlaceQuery,
  findCatalogCandidates,
  findBestLayer,
  isCatalogRecord,
  rankCandidateEmbeddings,
  refersToCurrentLocation,
} from "../naturalLanguageMapSearch";

const catalog: NaturalLanguageCatalogRecord[] = [
  {
    id: "ch.bfe.solarenergie-eignung-daecher",
    properties: {
      description:
        "Suitability of roofs for solar energy, photovoltaic panels and electricity production.",
      keywords: ["Solarenergie", "Photovoltaik", "panneaux solaires"],
      title: "Solar energy suitability of roofs",
    },
  },
  {
    id: "ch.swisstopo.swisstlm3d-wanderwege",
    properties: {
      description:
        "Hiking trails, sentiers pédestres and percorsi escursionistici.",
      keywords: ["Wanderwege", "wandern", "hiking"],
      title: "Hiking trails",
    },
  },
  {
    id: "ch.bav.haltestellen-oev",
    properties: {
      keywords: ["public transport", "öffentlicher Verkehr"],
      title: "Public transport stops",
    },
  },
  {
    id: "ch.astra.veloland",
    properties: {
      keywords: ["cycling", "vélo", "bicicletta"],
      title: "Cycling routes",
    },
  },
];

describe("natural-language map search", () => {
  it.each([
    ["en", "Can I wander in Brienz tomorrow?", "Brienz"],
    ["en", "wie viel solar energie hat bern", "bern"],
    ["de", "Zeige mir Wanderwege in Bern morgen", "Bern"],
    ["fr", "Montre les sentiers près de Lausanne demain", "Lausanne"],
    ["it", "Mostra i percorsi vicino a Bellinzona domani", "Bellinzona"],
  ])("extracts %s place queries", (locale, query, expected) => {
    expect(extractPlaceQuery(query, locale)).toBe(expected);
  });

  it.each([
    "Can I add a solar panel near my house?",
    "Eignet sich mein Dach bei mir?",
    "Puis-je installer des panneaux chez moi?",
    "Posso mettere pannelli a casa mia?",
  ])("detects current-location language in %s", (query) => {
    expect(refersToCurrentLocation(query)).toBe(true);
  });

  it("returns no place when the query has none", () => {
    expect(extractPlaceQuery("Show hiking trails", "en")).toBeUndefined();
  });

  it.each([
    [
      "Can I add a solarpannel to my house?",
      "ch.bfe.solarenergie-eignung-daecher",
    ],
    ["Kann ich in Brienz wandern?", "ch.swisstopo.swisstlm3d-wanderwege"],
    [
      "Montre les transports publics près de Lausanne",
      "ch.bav.haltestellen-oev",
    ],
    ["Mostra i percorsi per bicicletta a Bellinzona", "ch.astra.veloland"],
  ])("keeps the expected layer eligible for %s", (query, expected) => {
    expect(
      findCatalogCandidates(expandLayerQuery(query), catalog).some(
        ({ id }) => id === expected,
      ),
    ).toBe(true);
  });

  it("limits the records sent to the model", () => {
    expect(findCatalogCandidates("map data", catalog, 2)).toHaveLength(0);
    expect(findCatalogCandidates("routes", catalog, 1)).toHaveLength(1);
  });

  it.each([
    "Can I wander in Brienz?",
    "Zeige Wanderwege in Bern",
    "Montre les transports publics",
    "Mostra percorsi in bicicletta",
  ])("adds multilingual intent vocabulary for %s", (query) => {
    expect(expandLayerQuery(query)).not.toBe(query);
  });

  it("validates catalog record fields at runtime", () => {
    expect(isCatalogRecord({ id: "valid" })).toBe(true);
    expect(
      isCatalogRecord({
        id: "valid",
        properties: {
          description: "Description",
          keywords: ["one", "two"],
          title: "Title",
        },
      }),
    ).toBe(true);
    expect(isCatalogRecord({ id: 1 })).toBe(false);
    expect(isCatalogRecord({ id: "invalid", properties: null })).toBe(false);
    expect(
      isCatalogRecord({
        id: "invalid",
        properties: { keywords: ["valid", 2] },
      }),
    ).toBe(false);
  });

  it("chooses the layer with the highest normalized-vector similarity", () => {
    const layers = catalog.slice(0, 2);
    const embeddings = new Float32Array([
      1, 0, 0, 0, 0.8, 0.2, 0, 0, 0.1, 0.9, 0, 0,
    ]);

    expect(findBestLayer(embeddings, 4, layers)).toMatchObject({
      layer: layers[0],
      score: expect.closeTo(0.8),
    });
  });

  it("rejects malformed embedding output", () => {
    expect(findBestLayer(new Float32Array([1, 2]), 4, catalog)).toBeUndefined();
  });

  it("ranks multiple normalized embedding candidates", () => {
    const embeddings = new Float32Array([1, 0, 0.5, 0.5, 0.9, 0.1, 0.1, 0.9]);

    expect(
      rankCandidateEmbeddings(embeddings, 2, ["middle", "best", "last"], 2),
    ).toEqual([
      { id: "best", score: expect.closeTo(0.9) },
      { id: "middle", score: expect.closeTo(0.5) },
    ]);
  });

  it("rejects malformed ranked embedding input", () => {
    expect(
      rankCandidateEmbeddings(new Float32Array([1, 2]), 2, ["one", "two"]),
    ).toEqual([]);
    expect(
      rankCandidateEmbeddings(new Float32Array([1, 0, 0, 1]), 2, ["one"], 0),
    ).toEqual([]);
  });
});
