import type { InjectionKey, Ref } from "vue";

export type DisplayMode = "web" | "print" | "embed";

export const displayModeKey: InjectionKey<DisplayMode> = Symbol("displayMode");

// Responsive panels share one height, so switching between them keeps it.
export const panelSnapPointKey: InjectionKey<Ref<number | string | null>> =
  Symbol("panelSnapPoint");
