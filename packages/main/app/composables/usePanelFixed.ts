import type { InjectionKey, Ref } from "vue";

export type PanelFixed = Readonly<Ref<HTMLElement | null>>;

export const panelFixedKey: InjectionKey<PanelFixed> = Symbol("panelFixed");

/**
 * The area of a sidepanel or bottom sheet above its scrollable content. A
 * child can move parts of itself there with a Teleport, so they stay in place
 * while the rest scrolls and the scrollbar only runs along the content.
 */
export function usePanelFixed(): PanelFixed {
  return inject(panelFixedKey, shallowRef(null));
}
