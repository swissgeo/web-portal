export const FILE_TYPE_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "application/zip": "ZIP",
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "application/vnd.google-earth.kml+xml": "KML",
  "application/vnd.google-earth.kmz": "KMZ",
  "application/gpx+xml": "GPX",
};

export const ACCEPTED_MIME_TYPES = Object.keys(FILE_TYPE_LABELS);

export const ACCEPTED_EXTENSIONS = [".kml", ".kmz", ".gpx"];

export const ACCEPTED_FILE_TYPES = [
  ...ACCEPTED_MIME_TYPES,
  ...ACCEPTED_EXTENSIONS,
];

export const FILE_TYPE_LABEL_LIST = Object.values(FILE_TYPE_LABELS);
