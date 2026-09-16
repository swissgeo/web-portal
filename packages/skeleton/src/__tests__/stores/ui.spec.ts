import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

import {
  SIDEBAR_HANDLE_WIDTH,
  SidebarType,
  useSidebarStore,
} from "../../stores/ui";

const LAYER_CART_WIDTH = 320;
const GEOCATALOG_TREE_WIDTH = 1280;

describe("useSidebarStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("starts closed, leaving only the handle on the map", () => {
    const store = useSidebarStore();

    expect(store.currentSidebar).toBeNull();
    expect(store.isSidebarOpen).toBe(false);
    expect(store.sidebarWidth).toBe(SIDEBAR_HANDLE_WIDTH);
  });

  it("opens the layer cart at its width", () => {
    const store = useSidebarStore();

    store.setSidebar(SidebarType.LAYER_CART);

    expect(store.isSidebarOpen).toBe(true);
    expect(store.isLayerCartVisible).toBe(true);
    expect(store.isGeocatalogTreeVisible).toBe(false);
    expect(store.isContentSidebarVisible).toBe(false);
    expect(store.sidebarContentWidth).toBe(LAYER_CART_WIDTH);
    expect(store.sidebarWidth).toBe(LAYER_CART_WIDTH);
  });

  it("widens the content for the layer catalog", () => {
    const store = useSidebarStore();

    store.setSidebar(SidebarType.GEOCATALOG_TREE);

    expect(store.isSidebarOpen).toBe(true);
    expect(store.isGeocatalogTreeVisible).toBe(true);
    expect(store.isLayerCartVisible).toBe(false);
    expect(store.sidebarContentWidth).toBe(GEOCATALOG_TREE_WIDTH);
    // the catalog opens over the map, which keeps the layer cart offset
    expect(store.sidebarWidth).toBe(LAYER_CART_WIDTH);
  });

  it("gives the content sidebar the layer cart width", () => {
    const store = useSidebarStore();

    store.setSidebar(SidebarType.CONTENT);

    expect(store.isContentSidebarVisible).toBe(true);
    expect(store.isGeocatalogTreeVisible).toBe(false);
    expect(store.sidebarContentWidth).toBe(LAYER_CART_WIDTH);
  });

  it("closes back to the handle", () => {
    const store = useSidebarStore();
    store.setSidebar(SidebarType.GEOCATALOG_TREE);

    store.closeSidebar();

    expect(store.currentSidebar).toBeNull();
    expect(store.isSidebarOpen).toBe(false);
    expect(store.isGeocatalogTreeVisible).toBe(false);
    expect(store.sidebarWidth).toBe(SIDEBAR_HANDLE_WIDTH);
  });
});
