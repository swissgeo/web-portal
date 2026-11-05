import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { effectScope, nextTick } from "vue";

import { useIsDesktop } from "../useIsDesktop";

// A fake Nuxt app that lets the tests end the hydration.
const nuxtApp = vi.hoisted(() => {
  const app = {
    isHydrating: false,
    hydrationListeners: [] as Array<() => void>,
    hooks: {
      hookOnce: (_name: string, listener: () => void) => {
        app.hydrationListeners.push(listener);
      },
    },
    endHydration() {
      app.isHydrating = false;
      app.hydrationListeners.forEach((listener) => listener());
      app.hydrationListeners = [];
    },
  };
  return app;
});
mockNuxtImport("useNuxtApp", () => () => nuxtApp);

// happy-dom does not notify media query lists when the viewport is resized, so
// we fake `matchMedia` with lists that follow a width we control.
type ChangeListener = (_event: MediaQueryListEvent) => void;

let viewportWidth = 0;
const mediaQueryLists = new Set<{
  query: string;
  matches: boolean;
  listeners: Set<ChangeListener>;
}>();

function matchesWidth(query: string, width: number) {
  const minWidth = /min-width:\s*([\d.]+)px/.exec(query);
  const maxWidth = /max-width:\s*([\d.]+)px/.exec(query);
  return (
    (!minWidth || width >= Number(minWidth[1])) &&
    (!maxWidth || width <= Number(maxWidth[1]))
  );
}

function fakeMatchMedia(query: string) {
  const list = {
    query,
    matches: matchesWidth(query, viewportWidth),
    listeners: new Set<ChangeListener>(),
  };
  mediaQueryLists.add(list);
  return {
    media: query,
    get matches() {
      return list.matches;
    },
    addEventListener: (_type: "change", listener: ChangeListener) =>
      list.listeners.add(listener),
    removeEventListener: (_type: "change", listener: ChangeListener) =>
      list.listeners.delete(listener),
  } as unknown as MediaQueryList;
}

function setViewportWidth(width: number) {
  viewportWidth = width;
  for (const list of mediaQueryLists) {
    const matches = matchesWidth(list.query, width);
    if (matches !== list.matches) {
      list.matches = matches;
      const event = { matches, media: list.query } as MediaQueryListEvent;
      list.listeners.forEach((listener) => listener(event));
    }
  }
}

describe("useIsDesktop", () => {
  let scope: ReturnType<typeof effectScope>;

  beforeEach(() => {
    mediaQueryLists.clear();
    vi.spyOn(window, "matchMedia").mockImplementation(fakeMatchMedia);
    nuxtApp.isHydrating = false;
    nuxtApp.hydrationListeners = [];
    scope = effectScope();
  });

  afterEach(() => {
    scope.stop();
    vi.restoreAllMocks();
  });

  it.each([
    [320, false],
    [767, false],
    [768, true],
    [1280, true],
  ])(
    "at a viewport width of %ipx, useIsDektop() should return %s",
    (width, expected) => {
      setViewportWidth(width);

      const isDesktop = scope.run(() => useIsDesktop())!;

      expect(isDesktop.value).toBe(expected);
    },
  );

  it("follows the viewport when it is resized", async () => {
    setViewportWidth(1280);
    const isDesktop = scope.run(() => useIsDesktop())!;
    expect(isDesktop.value).toBe(true);

    setViewportWidth(400);
    await nextTick();
    expect(isDesktop.value).toBe(false);

    setViewportWidth(1024);
    await nextTick();
    expect(isDesktop.value).toBe(true);
  });

  it("returns false on desktop until the hydration ends", async () => {
    setViewportWidth(1280);
    nuxtApp.isHydrating = true;

    const isDesktop = scope.run(() => useIsDesktop())!;
    expect(isDesktop.value).toBe(false);

    nuxtApp.endHydration();
    await nextTick();
    expect(isDesktop.value).toBe(true);
  });
});
