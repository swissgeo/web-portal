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
  { label: "Text", icon: "i-lucide-type", value: "text", slot: "text" },
  { label: "Marker", icon: "i-lucide-map-pin", value: "icon", slot: "icon" },
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
  <div class="border-t border-default" data-testid="point-style-editor">
    <UAccordion
      :items="accordionItems"
      :ui="{ trigger: 'py-3 text-sm font-medium', body: 'pb-4' }"
    >
      <template #text-body>
        <div class="space-y-4">
          <div class="space-y-3">
            <UCheckbox
              v-model="showTitle"
              label="Show title"
              data-testid="point-show-title"
            />
            <UCheckbox
              v-model="showDescription"
              label="Show description"
              data-testid="point-show-description"
            />
          </div>
          <template v-if="showTitle || showDescription">
            <UFormField label="Text size" size="sm">
              <USelect
                v-model="textSize"
                :items="textSizesItems"
                class="w-full"
                data-testid="point-text-size"
              />
            </UFormField>
            <div class="flex items-center justify-between gap-4">
              <div class="space-y-1">
                <p class="text-sm text-toned">Placement</p>
                <p class="text-xs text-muted">Relative to the marker</p>
              </div>
              <PlacementSelector
                class="w-28 shrink-0"
                :placement="textPlacement"
                data-testid="point-text-placement"
                @placement-selected="textPlacement = $event"
              />
            </div>
            <label
              class="flex items-center justify-between gap-3 text-sm text-toned"
            >
              Text color
              <input
                v-model="textColor"
                type="color"
                class="size-8 shrink-0 cursor-pointer rounded-md border border-default bg-default p-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                data-testid="point-text-color"
              />
            </label>
            <label
              class="flex items-center justify-between gap-3 text-sm text-toned"
            >
              Text halo color
              <input
                v-model="textHaloColor"
                type="color"
                class="size-8 shrink-0 cursor-pointer rounded-md border border-default bg-default p-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                data-testid="point-text-halo-color"
              />
            </label>
          </template>
        </div>
      </template>
      <template #icon-body>
        <div class="space-y-4">
          <UCheckbox
            v-model="showIcon"
            label="Show marker"
            data-testid="point-show-icon"
          />
          <template v-if="showIcon">
            <UFormField label="Marker size" size="sm">
              <USelect
                v-model="iconSize"
                :items="iconSizesItems"
                class="w-full"
                data-testid="point-icon-size"
              />
            </UFormField>
            <IconPicker
              :icon-set-name="iconSetName"
              :icon-name="iconName"
              :icon-color="iconColor"
              data-testid="point-icon-picker"
              @icon-selected="onIconSelected"
              @color-selected="onColorSelected"
            />
          </template>
        </div>
      </template>
    </UAccordion>
  </div>
</template>
