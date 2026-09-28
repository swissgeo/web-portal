<script setup lang="ts">
import { useDrawing } from "@swissgeo/drawing";
import { useI18n } from "vue-i18n";

import CircleStyleEditor from "./CircleStyleEditor.vue";
import LinestringStyleEditor from "./LinestringStyleEditor.vue";
import PointStyleEditor from "./PointStyleEditor.vue";
import PolygonStyleEditor from "./PolygonStyleEditor.vue";

const { t } = useI18n();
const { focusedFeature, focusedFeatureType, title, description } = useDrawing();
</script>

<template>
  <div
    v-if="focusedFeature"
    :key="focusedFeature?.getId()"
    class="space-y-4"
    data-testid="drawing-feature-property-panel"
  >
    <div class="flex items-center gap-2 text-xs text-muted">
      <UIcon name="i-lucide-sliders-horizontal" class="size-3.5" />
      <span data-testid="drawing-feature-type">{{
        t(`toolbox.drawing.properties.${focusedFeatureType || "generic"}`)
      }}</span>
    </div>
    <UFormField :label="t('toolbox.drawing.fields.title')" size="sm">
      <UInput
        v-model="title"
        :placeholder="t('toolbox.drawing.fields.titlePlaceholder')"
        class="w-full"
        data-testid="drawing-feature-title"
      />
    </UFormField>
    <UFormField
      :label="t('toolbox.drawing.fields.description')"
      :hint="t('toolbox.drawing.fields.optional')"
      size="sm"
    >
      <UTextarea
        v-model="description"
        :placeholder="t('toolbox.drawing.fields.descriptionPlaceholder')"
        :rows="2"
        autoresize
        class="w-full"
        data-testid="drawing-feature-description"
      />
    </UFormField>
    <PolygonStyleEditor v-if="focusedFeatureType === 'Polygon'" />
    <CircleStyleEditor v-if="focusedFeatureType === 'Circle'" />
    <LinestringStyleEditor v-if="focusedFeatureType === 'LineString'" />
    <PointStyleEditor v-if="focusedFeatureType === 'Point'" />
  </div>
</template>
