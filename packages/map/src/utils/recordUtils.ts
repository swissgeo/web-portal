import type { Link as OGCLink } from "@swissgeo/shared/ogc";

// maybe this belongs to shared?
// or to a future layers package?

export const getLinksByProtocol = (
  links: OGCLink[],
  protocol: string
): OGCLink[] => {
  return links.filter((link: OGCLink) => link.protocol === protocol);
};
