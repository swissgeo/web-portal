<script setup lang="ts">
// Easter eggs: an emoji in an empty corner of the map, shown only when zoomed
// in. A click starts confetti. To add an egg, add a line to EGGS, at a spot
// where no background map has data.
import type { Map } from "ol";
import type MapBrowserEvent from "ol/MapBrowserEvent";
import type { Ref } from "vue";

import Overlay from "ol/Overlay";

const EGGS = [
  // South-west corner of the map grid: no map has data outside of it
  {
    emoji: "🥐",
    coordinate: [2_420_000, 1_030_000],
    maxResolution: 1,
    colors: ["#0055a4", "#ffffff", "#ef4135"],
  },
];

const CURSOR_EGGS = [
  {
    coordinate: [2_600_969, 1_197_427],
    icon: "/favicon.ico",
  },
  {
    coordinate: [2_531_792, 1_155_376],
    icon: "/images/cursor-egg.png",
  },
];

const CURSOR_TOLERANCE = 1;
const CURSOR_DELAY_MS = 10_000;

const olMap = inject<Ref<Map | undefined>>("olMap");
const eggElements = useTemplateRef<HTMLElement[]>("eggs");
const resolution = ref(Infinity);
const confetti = ref<{ color: string; left: number; delay: number }[]>([]);
const triggeredCursorEggs = new Set<number>();
let cursorTimer: ReturnType<typeof setTimeout> | undefined;
let activeCursorEgg: number | undefined;

watch([() => olMap?.value, eggElements], ([map, elements]) => {
  if (!map || !elements?.length) {
    return;
  }
  for (const element of elements) {
    const egg = EGGS[Number(element.dataset.index)]!;
    map.addOverlay(
      new Overlay({
        element,
        position: egg.coordinate,
        // The egg sits outside the corner, never on the map data
        positioning: "top-right",
      }),
    );
  }
  const view = map.getView();
  resolution.value = view.getResolution() ?? Infinity;
  view.on("change:resolution", () => {
    resolution.value = view.getResolution() ?? Infinity;
  });
});

watch(
  () => olMap?.value,
  (map) => {
    if (!map) {
      return;
    }

    const viewport = map.getViewport();
    if (!viewport) {
      return;
    }

    const clearCursorTimer = () => {
      clearTimeout(cursorTimer);
      cursorTimer = undefined;
      activeCursorEgg = undefined;
    };

    const onPointerMove = (event: MapBrowserEvent) => {
      const index = CURSOR_EGGS.findIndex(
        (egg, eggIndex) =>
          !triggeredCursorEggs.has(eggIndex) &&
          Math.abs(event.coordinate[0]! - egg.coordinate[0]!) <=
            CURSOR_TOLERANCE &&
          Math.abs(event.coordinate[1]! - egg.coordinate[1]!) <=
            CURSOR_TOLERANCE,
      );

      if (index === -1) {
        clearCursorTimer();
        return;
      }

      if (activeCursorEgg === index) {
        return;
      }

      clearCursorTimer();
      activeCursorEgg = index;
      cursorTimer = setTimeout(() => {
        const egg = CURSOR_EGGS[index]!;
        triggeredCursorEggs.add(index);
        viewport.style.cursor = `url("${egg.icon}") 0 0, auto`;
        clearCursorTimer();
      }, CURSOR_DELAY_MS);
    };

    map.on("pointermove", onPointerMove);
    viewport.addEventListener("pointerleave", clearCursorTimer);

    return () => {
      map.un("pointermove", onPointerMove);
      viewport.removeEventListener("pointerleave", clearCursorTimer);
      clearCursorTimer();
    };
  },
  { immediate: true },
);

function celebrate(colors: string[]) {
  confetti.value = Array.from({ length: 30 }, (_, index) => ({
    color: colors[index % colors.length]!,
    left: Math.random() * 100,
    delay: Math.random() * 600,
  }));
  setTimeout(() => (confetti.value = []), 3000);
}
</script>

<template>
  <div>
    <!-- No tab stop, hidden from screen readers, a click keeps the focus -->
    <button
      v-for="(egg, index) in EGGS"
      v-show="resolution <= egg.maxResolution"
      ref="eggs"
      :key="egg.emoji"
      :data-index="index"
      type="button"
      tabindex="-1"
      aria-hidden="true"
      class="cursor-pointer text-2xl select-none"
      @mousedown.prevent
      @click="celebrate(egg.colors)"
    >
      {{ egg.emoji }}
    </button>
    <Teleport to="body">
      <div
        v-if="confetti.length"
        aria-hidden="true"
        class="pointer-events-none fixed inset-0 z-100 overflow-hidden motion-reduce:hidden"
      >
        <span
          v-for="(piece, index) in confetti"
          :key="index"
          class="confetti absolute -top-4 h-3 w-2"
          :style="{
            left: `${piece.left}%`,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}ms`,
          }"
        />
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.confetti {
  animation: fall 2.2s ease-in forwards;
}

@keyframes fall {
  to {
    transform: translateY(110vh) rotate(540deg);
  }
}
</style>
