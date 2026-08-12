import log from "@swissgeo/log";

import type { IconApiDescription } from "./Icon";

import { Icon } from "./Icon";

export type IconSetApiDescription = {
  colorable: boolean;
  has_description: boolean;
  icons_url: string;
  language: "de" | "fr" | "it" | null;
  name: string;
  template_url: string;
};

/**
 * The icon sets do not include human readable names,
 * so we provide a mapping here for known icon set names.
 */
const humanReadableIconSetNameMap: Record<string, string> = {
  "babs-v2-de": "Zivile signaturen",
  "babs-v2-fr": "Signes conventionnels civils",
  "babs-v2-it": "Segni convenzionali civili",
  default: "Default Icons",
};

export class IconSet {
  public colorable: boolean;
  public hasDescription: boolean;
  public iconsUrl: string;
  public language: "de" | "fr" | "it" | null;
  public name: string;
  public templateUrl: string;
  public icons: Icon[] = [];

  constructor(payload: IconSetApiDescription) {
    this.colorable = payload.colorable;
    this.hasDescription = payload.has_description;
    this.iconsUrl = payload.icons_url;
    this.language = payload.language;
    this.name = payload.name;
    this.templateUrl = payload.template_url;
  }

  async loadIcons(): Promise<void> {
    this.icons = []; // Clear existing icons before loading new ones
    try {
      const response = await fetch(this.iconsUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch icons: ${response.statusText}`);
      }
      const data: { items: IconApiDescription[] } = await response.json();

      for (const iconItem of data.items) {
        const newIcon = new Icon(iconItem);
        newIcon.setIconSetInstance(this);
        this.icons.push(newIcon);
      }
    } catch (_error) {
      log.error("Error loading icons");
    }
  }

  getHumanReadableName(): string {
    return humanReadableIconSetNameMap[this.name] || this.name;
  }

  getIconByName(iconName: string): Icon | undefined {
    return this.icons.find((icon) => icon.name === iconName);
  }
}
