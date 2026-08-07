import { describe, expect, it } from "vitest";
import { ref } from "vue";

import type { DistributionCollection } from "@/types/Records";

import { useDistributionProtocols } from "../useDistributionProtocols";
import ChBafuSchutzgebieteLuftfahrtDistributions from "./fixtures/distribution-collection_ch.bafu.schutzgebiete-luftfahrt.json";

describe("useDistributionProtocols composable", () => {
  it("extracts protocols from distribution collection", () => {
    const distributionCollection = ref(
      ChBafuSchutzgebieteLuftfahrtDistributions as DistributionCollection,
    );
    const { availableProtocols } = useDistributionProtocols(
      distributionCollection,
    );

    expect(availableProtocols.value).toEqual(["ogc:wmts", "ogc:wms"]);
  });

  it("returns empty array for empty features", () => {
    const distributionCollection = ref({
      type: "FeatureCollection" as const,
      features: [],
      links: [],
    });
    const { availableProtocols } = useDistributionProtocols(
      distributionCollection,
    );

    expect(availableProtocols.value).toEqual([]);
  });
});
