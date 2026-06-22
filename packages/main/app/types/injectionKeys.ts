import type { InjectionKey } from "vue";

export type DisplayMode = "web" | "print";

export const displayModeKey: InjectionKey<DisplayMode> = Symbol("displayMode");
