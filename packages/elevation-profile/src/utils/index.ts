import { format } from "@swissgeo/numbers";

export function formatDistance(value?: number) {
  if (!value || isNaN(value)) {
    return "0.00m";
  }
  if (value < 1000) {
    return `${value.toFixed(2)}m`;
  }
  return `${(value / 1000).toFixed(2)}km`;
}

export function formatElevation(value?: number) {
  if (!value || isNaN(value)) {
    return "0.00m";
  }
  if (value < 1000) {
    return `${value.toFixed(2)}m`;
  }
  return `${format(Math.round(value), 3)}m`;
}
