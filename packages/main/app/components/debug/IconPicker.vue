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
  <div>
    <div
      v-if="numberOfIconSets > 0"
      class="mb-3 flex w-full items-center gap-3"
    >
      <USelect
        v-model="selectedIconSetName"
        :items="iconSetsItems"
        class="w-full"
      />
    </div>

    <!-- Symbol color -->
    <div v-if="isSetColorable" class="mb-3 flex items-center gap-3">
      <label class="mb-1 block text-sm font-medium text-gray-900">Color</label>
      <div class="flex gap-2">
        <input
          v-model="selectedIconColor"
          type="color"
          class="h-8 w-12 cursor-pointer rounded border border-gray-300"
          data-testid="icon-color"
        />
      </div>
    </div>

    <div
      class="grid h-[170px] w-full grid-cols-6 content-start gap-2 overflow-y-auto"
    >
      <div
        v-for="icon in iconsFromSet"
        :key="icon.getName()"
        class="flex aspect-square w-full items-center justify-center"
      >
        <img
          :src="icon.getUrl({ color: selectedIconColor })"
          :alt="icon.getDefaultDescription() || icon.getName()"
          class="max-h-full max-w-full cursor-pointer rounded"
          :class="{
            'bg-gray-300':
              icon.getName() === props.iconName &&
              selectedIconSet?.name === props.iconSetName,
          }"
          @click="emit('icon-selected', icon)"
        />
      </div>
    </div>
  </div>
</template>
