import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

import {
  SIDEBAR_CONTENT_WIDTH,
  SIDEBAR_HANDLE_WIDTH,
  SIDEBAR_ICON_WIDTH,
  SIDEBAR_PANEL_WIDTH,
  SidebarType,
  useSidebarStore,
} from "@/stores/ui";

describe("sidebar store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("uses the Figma panel width when the sidebar is open", () => {
    const store = useSidebarStore();

    expect(SIDEBAR_CONTENT_WIDTH).toBe(347);
    expect(SIDEBAR_PANEL_WIDTH).toBe(315);
    expect(SIDEBAR_HANDLE_WIDTH).toBe(32);
    expect(SIDEBAR_PANEL_WIDTH + SIDEBAR_HANDLE_WIDTH).toBe(
      SIDEBAR_CONTENT_WIDTH,
    );
    expect(store.sidebarWidth).toBe(SIDEBAR_ICON_WIDTH);

    store.setSidebar(SidebarType.LAYER_CART);

    expect(store.sidebarWidth).toBe(SIDEBAR_ICON_WIDTH + SIDEBAR_CONTENT_WIDTH);
  });

  it("closes the active sidebar", () => {
    const store = useSidebarStore();
    store.setSidebar(SidebarType.LAYER_CART);

    store.closeSidebar();

    expect(store.currentSidebar).toBeNull();
    expect(store.isSidebarOpen).toBe(false);
  });
});
