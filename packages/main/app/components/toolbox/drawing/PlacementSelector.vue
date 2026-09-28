<script setup lang="ts">
import type { RelativePlacement } from "@swissgeo/drawing";

import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps<{
  placement: RelativePlacement;
}>();

const emit = defineEmits<{
  "placement-selected": [placement: RelativePlacement];
}>();
const placements = [
  { value: "north-west", icon: "i-lucide-arrow-up-left" },
  { value: "north", icon: "i-lucide-arrow-up" },
  { value: "north-east", icon: "i-lucide-arrow-up-right" },
  { value: "west", icon: "i-lucide-arrow-left" },
  { value: "center", icon: "i-lucide-dot" },
  { value: "east", icon: "i-lucide-arrow-right" },
  {
    value: "south-west",
    icon: "i-lucide-arrow-down-left",
  },
  { value: "south", icon: "i-lucide-arrow-down" },
  {
    value: "south-east",
    icon: "i-lucide-arrow-down-right",
  },
] as const;
</script>

<template>
  <div
    class="grid grid-cols-3 gap-1 rounded-lg border border-default bg-elevated/50 p-1"
    role="group"
    :aria-label="t('toolbox.drawing.placement.label')"
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
      :aria-label="t(`toolbox.drawing.placement.${position.value}`)"
      :title="t(`toolbox.drawing.placement.${position.value}`)"
      :aria-pressed="props.placement === position.value"
      @click="emit('placement-selected', position.value)"
    >
      <UIcon :name="position.icon" class="size-4" />
    </button>
  </div>
</template>
