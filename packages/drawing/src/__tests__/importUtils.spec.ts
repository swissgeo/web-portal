import { strToU8, zipSync } from "fflate";
import { describe, expect, it } from "vitest";

import { unzipKmzBuffer } from "@/utils/importUtils";

function archive(files: Record<string, Uint8Array>): ArrayBuffer {
  return zipSync(files).buffer as ArrayBuffer;
}

describe("unzipKmzBuffer", () => {
  it("extracts nested KML and PNG/SVG icons and ignores unrelated files", async () => {
    const kml = "<kml><name>Zürich</name></kml>";
    const { kmlContent, iconFiles } = await unzipKmzBuffer(
      archive({
        "nested/DOC.KML": strToU8(kml),
        "icons/marker.png": new Uint8Array([137, 80, 78, 71]),
        "icons/marker.svg": strToU8("<svg />"),
        "readme.txt": strToU8("ignored"),
      }),
    );
    expect(kmlContent).toBe(kml);
    expect(Object.keys(iconFiles)).toEqual([
      "icons/marker.png",
      "icons/marker.svg",
    ]);
    expect(iconFiles["icons/marker.png"].type).toBe("image/png");
    expect(
      new Uint8Array(await iconFiles["icons/marker.png"].arrayBuffer()),
    ).toEqual(new Uint8Array([137, 80, 78, 71]));
    expect(iconFiles["icons/marker.svg"].type).toBe("image/svg+xml");
    expect(await iconFiles["icons/marker.svg"].text()).toBe("<svg />");
  });

  it("accepts KML without embedded icons", async () => {
    await expect(
      unzipKmzBuffer(archive({ "doc.kml": strToU8("<kml />") })),
    ).resolves.toEqual({ kmlContent: "<kml />", iconFiles: {} });
  });

  it.each([
    {},
    { "doc.kml": new Uint8Array() },
    { "icon.png": new Uint8Array([1]) },
  ])("rejects an archive without nonempty KML", async (files) => {
    await expect(unzipKmzBuffer(archive(files))).rejects.toThrow(
      "No KML file found in KMZ archive",
    );
  });

  it("rejects invalid ZIP data", async () => {
    await expect(unzipKmzBuffer(new ArrayBuffer(8))).rejects.toThrow();
  });
});
