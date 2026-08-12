import type { IconSet } from "./IconSet";

import { hexColorToRgb } from "./color";

export type IconApiDescription = {
  anchor: [number, number];
  description: { de: string; fr: string; it: string } | null;
  icon_set: string;
  name: string;
  size: [number, number];
  template_url: string;
  url: string;
};

type IconUrlOptions = {
  /**
   * Color in hex format (e.g., "#FF0000" for red).
   * Default: "#FF0000" (red) if not provided.
   */
  color?: string;

  /**
   * Integer factor to scale the icon size.
   * Default: 1 (no scaling) if not provided.
   */
  scale?: number;
};

export class Icon {
  public anchor: [number, number];
  public description: { de: string; fr: string; it: string } | null;
  public iconSet: string;
  public name: string;
  public size: [number, number];
  public templateUrl: string;
  public url: string;
  public iconSetInstance: IconSet | null = null;

  constructor(payload: IconApiDescription) {
    this.anchor = payload.anchor;
    this.description = payload.description;
    this.iconSet = payload.icon_set;
    this.name = payload.name;
    this.size = payload.size;
    this.templateUrl = payload.template_url;
    this.url = payload.url;
  }

  setIconSetInstance(iconSet: IconSet) {
    this.iconSetInstance = iconSet;
  }

  getAnchor(): [number, number] {
    return this.anchor;
  }

  getSize(): [number, number] {
    return this.size;
  }

  getUrl(options: IconUrlOptions = {}): string {
    const color = hexColorToRgb(options.color || "#FF0000");
    const scale = `${options.scale || 1}x`;

    return this.templateUrl
      .replace("{icon_set_name}", this.iconSet)
      .replace("{icon_name}", this.name)
      .replace("{icon_scale}", scale)
      .replace("{r}", color[0].toString())
      .replace("{g}", color[1].toString())
      .replace("{b}", color[2].toString());
  }

  getDescription(): { de: string; fr: string; it: string } | null {
    return this.description;
  }

  getDefaultDescription(): string | null {
    if (
      !this.description ||
      !this.iconSetInstance ||
      !this.iconSetInstance.language
    ) {
      return null;
    }
    return this.description[this.iconSetInstance.language];
  }

  getIconSet(): string {
    return this.iconSet;
  }

  getName(): string {
    return this.name;
  }

  isColorable(): boolean {
    return this.iconSetInstance ? this.iconSetInstance.colorable : false;
  }

  hasDescription(): boolean {
    return this.iconSetInstance ? this.iconSetInstance.hasDescription : false;
  }
}
