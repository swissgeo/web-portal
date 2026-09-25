<script setup lang="ts">
import type { RelativePlacement } from "@swissgeo/drawing";

const props = defineProps<{
  placement: RelativePlacement;
}>();

const emit = defineEmits<{
  "placement-selected": [placement: RelativePlacement];
}>();
const placements = [
  { value: "north-west", label: "Top left", icon: "i-lucide-arrow-up-left" },
  { value: "north", label: "Top", icon: "i-lucide-arrow-up" },
  { value: "north-east", label: "Top right", icon: "i-lucide-arrow-up-right" },
  { value: "west", label: "Left", icon: "i-lucide-arrow-left" },
  { value: "center", label: "Center", icon: "i-lucide-dot" },
  { value: "east", label: "Right", icon: "i-lucide-arrow-right" },
  {
    value: "south-west",
    label: "Bottom left",
    icon: "i-lucide-arrow-down-left",
  },
  { value: "south", label: "Bottom", icon: "i-lucide-arrow-down" },
  {
    value: "south-east",
    label: "Bottom right",
    icon: "i-lucide-arrow-down-right",
  },
] as const;
</script>

<template>
  <div
    class="grid grid-cols-3 gap-1 rounded-lg border border-default bg-elevated/50 p-1"
    role="group"
    aria-label="Text placement"
  >
    <button
      v-for="position in placements"
      :key="position.value"
      type="button"
      class="flex aspect-square items-center justify-center rounded transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      :class="
        props.placement === position.value
          ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
          : 'text-muted hover:bg-default hover:text-highlighted'
      "
      :aria-label="position.label"
      :title="position.label"
      :aria-pressed="props.placement === position.value"
      @click="emit('placement-selected', position.value)"
    >
      <UIcon :name="position.icon" class="size-4" />
    </button>
  </div>
</template>
