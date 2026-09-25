<script setup lang="ts">
import type { Icon } from "@swissgeo/drawing";

import { useIconsStore } from "@swissgeo/drawing";
import { useDebounceFn } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { computed, ref, watch } from "vue";

const props = defineProps<{
  iconSetName: string;
  iconName: string;
  iconColor: string;
}>();

const emit = defineEmits<{
  "color-selected": [color: string];
  "icon-selected": [icon: Icon];
}>();

const iconsStore = useIconsStore();

const { iconSets } = storeToRefs(iconsStore);

const numberOfIconSets = computed(() => iconSets.value.length);
const selectedIconSetName = ref(props.iconSetName);
const selectedIconSet = computed(
  () =>
    iconSets.value.find(
      (iconSet) => iconSet.name === selectedIconSetName.value,
    ) ?? null,
);
const iconsFromSet = computed(() => selectedIconSet.value?.icons || []);
const isSetColorable = computed(
  () => selectedIconSet.value?.colorable || false,
);
// The selection of the color is debounced because when the color changes, the icons URL is updated
// and this can be expensive if the user is dragging the color picker.
const emitColorSelected = useDebounceFn((color: string) => {
  emit("color-selected", color);
}, 200);
const selectedIconColor = computed({
  get: () => props.iconColor,
  set: (color: string) => void emitColorSelected(color),
});

// Update the list of icons if the icon set name changes by selecting another
// icon that displays a different icon set.
watch(
  () => props.iconSetName,
  (iconSetName) => {
    selectedIconSetName.value = iconSetName;
  },
);

const iconSetsItems = computed(() =>
  iconSets.value.map((iconSet) => ({
    label: iconSet.getHumanReadableName(),
    value: iconSet.name,
  })),
);
</script>

<template>
  <div class="w-full space-y-3">
    <UFormField v-if="numberOfIconSets > 0" label="Symbol collection" size="sm">
      <USelect
        v-model="selectedIconSetName"
        :items="iconSetsItems"
        class="w-full"
      />
    </UFormField>
    <label
      v-if="isSetColorable"
      class="flex items-center justify-between gap-3 text-sm text-toned"
    >
      Symbol color
      <input
        v-model="selectedIconColor"
        type="color"
        class="size-8 shrink-0 cursor-pointer rounded-md border border-default bg-default p-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        data-testid="icon-color"
      />
    </label>
    <div
      class="grid max-h-48 grid-cols-6 content-start gap-1.5 overflow-y-auto rounded-lg border border-default bg-elevated/50 p-2"
      role="group"
      aria-label="Marker symbols"
    >
      <button
        v-for="icon in iconsFromSet"
        :key="icon.getName()"
        type="button"
        class="flex aspect-square min-w-0 items-center justify-center rounded-md p-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        :class="
          icon.getName() === props.iconName &&
          selectedIconSet?.name === props.iconSetName
            ? 'bg-primary/10 ring-1 ring-primary/40'
            : 'hover:bg-default'
        "
        :aria-label="icon.getDefaultDescription() || icon.getName()"
        :title="icon.getDefaultDescription() || icon.getName()"
        :aria-pressed="
          icon.getName() === props.iconName &&
          selectedIconSet?.name === props.iconSetName
        "
        @click="emit('icon-selected', icon)"
      >
        <img
          :src="icon.getUrl({ color: selectedIconColor })"
          alt=""
          class="max-h-7 max-w-full object-contain"
          loading="lazy"
        />
      </button>
      <p
        v-if="iconsFromSet.length === 0"
        class="col-span-6 py-6 text-center text-xs text-muted"
      >
        No symbols available.
      </p>
    </div>
  </div>
</template>
