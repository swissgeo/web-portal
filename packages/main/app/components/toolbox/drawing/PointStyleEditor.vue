<script setup lang="ts">
import type { AccordionItem } from "@nuxt/ui";
import type { Icon } from "@swissgeo/drawing";

import { ICON_SIZE, TEXT_SIZE, useDrawing } from "@swissgeo/drawing";
import { useI18n } from "vue-i18n";

import IconPicker from "./IconPicker.vue";
import PlacementSelector from "./PlacementSelector.vue";

const { t } = useI18n();

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

const iconSizesItems = computed(() =>
  Object.keys(ICON_SIZE).map((size) => ({
    label: t(`toolbox.drawing.sizes.${size}`),
    value: size,
  })),
);

const textSizesItems = computed(() =>
  Object.keys(TEXT_SIZE).map((size) => ({
    label: t(`toolbox.drawing.sizes.${size}`),
    value: size,
  })),
);

const accordionItems = computed<AccordionItem[]>(() => [
  {
    label: t("toolbox.drawing.tools.text"),
    icon: "i-lucide-type",
    value: "text",
    slot: "text",
  },
  {
    label: t("toolbox.drawing.tools.marker"),
    icon: "i-lucide-map-pin",
    value: "icon",
    slot: "icon",
  },
]);

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
              :label="t('toolbox.drawing.style.showTitle')"
              data-testid="point-show-title"
            />
            <UCheckbox
              v-model="showDescription"
              :label="t('toolbox.drawing.style.showDescription')"
              data-testid="point-show-description"
            />
          </div>
          <template v-if="showTitle || showDescription">
            <UFormField :label="t('toolbox.drawing.style.textSize')" size="sm">
              <USelect
                v-model="textSize"
                :items="textSizesItems"
                class="w-full"
                data-testid="point-text-size"
              />
            </UFormField>
            <div class="flex items-center justify-between gap-4">
              <div class="space-y-1">
                <p class="text-sm text-toned">
                  {{ t("toolbox.drawing.style.placement") }}
                </p>
                <p class="text-xs text-muted">
                  {{ t("toolbox.drawing.style.relativeToMarker") }}
                </p>
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
              {{ t("toolbox.drawing.style.textColor") }}
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
              {{ t("toolbox.drawing.style.textHaloColor") }}
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
            :label="t('toolbox.drawing.style.showMarker')"
            data-testid="point-show-icon"
          />
          <template v-if="showIcon">
            <UFormField
              :label="t('toolbox.drawing.style.markerSize')"
              size="sm"
            >
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
