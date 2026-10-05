import type { InjectionKey, Ref } from "vue";

export type PanelScroller = Readonly<Ref<HTMLElement | null>>;

export const panelScrollerKey: InjectionKey<PanelScroller> =
  Symbol("panelScroller");

/**
 * A scrollable element in a sidepanel or bottom sheet, which a child component
 * can use to implement infinite scroll.
 */
export function usePanelScroller(): PanelScroller {
  return inject(panelScrollerKey, shallowRef(null));
}
