<script setup lang="ts">
import type { AccordionItem } from "@nuxt/ui";
import type { Icon } from "@swissgeo/drawing";

import { ICON_SIZE, TEXT_SIZE, useDrawing } from "@swissgeo/drawing";

import IconPicker from "./IconPicker.vue";
import PlacementSelector from "./PlacementSelector.vue";

const {
  textColor,
  iconSetName,
  iconName,
  showTitle,
  showDescription,
  textHaloColor,
  textSize,
  textPlacement,
  iconAnchor,
  iconColor,
  iconSize,
  showIcon,
} = useDrawing();

const iconSizesItems = ref(
  Object.keys(ICON_SIZE).map((size) => ({
    label: size,
    value: size,
  })),
);

const textSizesItems = ref(
  Object.keys(TEXT_SIZE).map((size) => ({
    label: size,
    value: size,
  })),
);

const accordionItems: AccordionItem[] = [
  { label: "Text styling", value: "text", slot: "text" },
  { label: "Icon styling", value: "icon", slot: "icon" },
];

function onIconSelected(icon: Icon) {
  iconAnchor.value = icon.anchor;
  iconSetName.value = icon.iconSet;
  iconName.value = icon.name;
}

function onColorSelected(color: string) {
  iconColor.value = color;
}
</script>

<template>
  <div
    class="rounded border border-gray-300 bg-gray-50 p-4"
    data-testid="point-style-editor"
  >
    <UAccordion :items="accordionItems">
      <template #text-body>
        <!-- Display title -->
        <div class="mb-3 flex items-center gap-3">
          <label class="mb-1 block text-sm font-medium text-gray-900"
            >Display title</label
          >
          <UCheckbox v-model="showTitle" />
          <div class="flex gap-2"></div>
        </div>

        <!-- Display description -->
        <div class="mb-3 flex items-center gap-3">
          <label class="mb-1 block text-sm font-medium text-gray-900"
            >Display description</label
          >
          <UCheckbox v-model="showDescription" />
          <div class="flex gap-2"></div>
        </div>

        <!-- Text size -->
        <div
          v-if="showTitle || showDescription"
          class="mb-3 flex items-center gap-3"
        >
          <label class="mb-1 block text-sm font-medium text-gray-900"
            >Text Size</label
          >
          <USelect v-model="textSize" :items="textSizesItems" />
        </div>

        <!-- Text placement -->
        <div
          v-if="showTitle || showDescription"
          class="mb-3 flex flex-col items-center gap-3"
        >
          <PlacementSelector
            class="mx-auto w-1/3"
            :placement="textPlacement"
            @placement-selected="textPlacement = $event"
          />
        </div>

        <!-- Text color -->
        <div
          v-if="showTitle || showDescription"
          class="mb-3 flex items-center gap-3"
        >
          <label class="mb-1 block text-sm font-medium text-gray-900"
            >Text color</label
          >
          <div class="flex gap-2">
            <input
              type="color"
              v-model="textColor"
              class="h-8 w-12 cursor-pointer rounded border border-gray-300"
              data-testid="point-color"
            />
          </div>
        </div>

        <!-- Text halo color -->
        <div
          v-if="showTitle || showDescription"
          class="mb-3 flex items-center gap-3"
        >
          <label class="mb-1 block text-sm font-medium text-gray-900"
            >Text halo color</label
          >
          <div class="flex gap-2">
            <input
              type="color"
              v-model="textHaloColor"
              class="h-8 w-12 cursor-pointer rounded border border-gray-300"
              data-testid="point-color"
            />
          </div>
        </div>
      </template>

      <template #icon-body>
        <!-- Display icon -->
        <div class="mb-3 flex items-center gap-3">
          <label class="mb-1 block text-sm font-medium text-gray-900"
            >Display icon</label
          >
          <UCheckbox v-model="showIcon" />
          <div class="flex gap-2"></div>
        </div>

        <!-- Icon size -->
        <div v-if="showIcon" class="mb-3 flex items-center gap-3">
          <label class="mb-1 block text-sm font-medium text-gray-900"
            >Icon Size</label
          >
          <USelect v-model="iconSize" :items="iconSizesItems" />
        </div>

        <!-- Icon picker -->
        <div v-if="showIcon" class="mb-3 flex items-center gap-3">
          <IconPicker
            :icon-set-name="iconSetName"
            :icon-name="iconName"
            :icon-color="iconColor"
            @icon-selected="onIconSelected"
            @color-selected="onColorSelected"
          />
        </div>
      </template>
    </UAccordion>
  </div>
</template>
