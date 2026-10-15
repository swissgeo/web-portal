import { useDrawerSwipeToClose } from "~/components/sidebar/useDrawerSwipeToClose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { effectScope, nextTick, ref } from "vue";

// happy-dom has no layout: the drawer box is 600px high and ends 100px above
// the bottom of an 800px high window
function makeDrawer(top: number) {
  const drawer = document.createElement("div");
  Object.defineProperties(drawer, {
    offsetTop: { value: 100 },
    offsetHeight: { value: 600 },
  });
  drawer.getBoundingClientRect = () => ({ top }) as DOMRect;
  document.body.append(drawer);
  return drawer;
}

function pointer(drawer: HTMLElement, type: string, y: number, time: number) {
  const event = new Event(type);
  Object.defineProperties(event, {
    clientY: { value: y },
    timeStamp: { value: time },
  });
  drawer.dispatchEvent(event);
}

describe("useDrawerSwipeToClose", () => {
  let scope: ReturnType<typeof effectScope>;
  const onClose = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("innerHeight", 800);
    scope = effectScope();
    onClose.mockClear();
  });

  afterEach(() => {
    scope.stop();
    vi.unstubAllGlobals();
  });

  // The partial snap point shows 400px of the drawer (600 - 800 + 600)
  async function swipe(
    endTop: number,
    moves: [number, number][],
    mayClose = true,
  ) {
    const drawer = makeDrawer(endTop);
    const { isOpen } = scope.run(() =>
      useDrawerSwipeToClose(ref(drawer), {
        mayClose: () => mayClose,
        partialSnapHeight: () => 600,
        onClose,
      }),
    )!;
    await nextTick();
    pointer(drawer, "pointerdown", moves[0]![0], moves[0]![1]);
    for (const [y, time] of moves.slice(1)) {
      pointer(drawer, "pointermove", y, time);
    }
    pointer(drawer, "pointerup", moves.at(-1)![0], moves.at(-1)![1]);
    drawer.dispatchEvent(new Event("transitionend"));
    return isOpen.value;
  }

  it("closes when the end of a quick swipe carries the drawer past half its height", async () => {
    // 100px in the last 100ms projects 300px further, below 200px
    const isOpen = await swipe(350, [
      [0, 0],
      [50, 50],
      [150, 150],
    ]);

    expect(isOpen).toBe(false);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("closes after a slow swipe that already passed half its height", async () => {
    const isOpen = await swipe(550, [
      [0, 0],
      [250, 1000],
      [251, 1090],
    ]);

    expect(isOpen).toBe(false);
  });

  it("stays open after a short slow swipe, so the drawer snaps back", async () => {
    const isOpen = await swipe(330, [
      [0, 0],
      [20, 500],
      [30, 600],
    ]);

    expect(isOpen).toBe(true);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("ignores a pause at the start of the swipe", async () => {
    // Over the whole swipe it is slow, at its end it is quick
    const isOpen = await swipe(350, [
      [0, 0],
      [0, 2000],
      [150, 2100],
    ]);

    expect(isOpen).toBe(false);
  });

  it("leaves the decision to vaul when the drawer may not close", async () => {
    const isOpen = await swipe(
      550,
      [
        [0, 0],
        [250, 100],
      ],
      false,
    );

    expect(isOpen).toBe(true);
  });
});
