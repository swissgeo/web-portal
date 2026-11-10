<script setup lang="ts">
// Easter eggs: an emoji in an empty corner of the map, shown only when zoomed
// in. A click starts confetti. To add an egg, add a line to EGGS, at a spot
// where no background map has data.
import type { Map } from "ol";
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

const olMap = inject<Ref<Map | undefined>>("olMap");
const eggElements = useTemplateRef<HTMLElement[]>("eggs");
const resolution = ref(Infinity);
const confetti = ref<{ color: string; left: number; delay: number }[]>([]);

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
