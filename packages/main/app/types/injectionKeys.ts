import type { InjectionKey } from "vue";

export type DisplayMode = "web" | "print" | "embed";

export const displayModeKey: InjectionKey<DisplayMode> = Symbol("displayMode");
