import { unzip } from "fflate";

export async function unzipKmzBuffer(kmzDataBuffer: ArrayBuffer) {
  const uint8Array = new Uint8Array(kmzDataBuffer);

  const unzipped = await new Promise<Record<string, Uint8Array>>(
    (resolve, reject) => {
      unzip(
        uint8Array,
        (err: Error | null, data: Record<string, Uint8Array>) => {
          if (err) {
            reject(new Error(err.message));
          } else {
            resolve(data);
          }
        },
      );
    },
  );

  const decoder = new TextDecoder("utf-8");
  let kmlContent = "";
  const iconFiles: Record<string, Blob> = {};

  for (const [filename, content] of Object.entries(unzipped)) {
    if (filename.toLowerCase().endsWith(".kml")) {
      kmlContent = decoder.decode(content);
    } else if (filename.endsWith(".png")) {
      const blob = new Blob([content as BlobPart], {
        type: "image/png",
      });
      iconFiles[filename] = blob;
    } else if (filename.endsWith(".svg")) {
      const blob = new Blob([content as BlobPart], {
        type: "image/svg+xml",
      });
      iconFiles[filename] = blob;
    }
  }

  if (!kmlContent) {
    throw new Error("No KML file found in KMZ archive");
  }

  return { kmlContent, iconFiles };
}
