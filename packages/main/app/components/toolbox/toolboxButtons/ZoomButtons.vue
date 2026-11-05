<script setup lang="ts">
import type { ActionDispatcher } from "@swissgeo/shared/action-dispatcher";

import { usePositionStore } from "@swissgeo/map";
import { useI18n } from "vue-i18n";

const dispatcher: ActionDispatcher = { name: "ZoomButtons.vue" };

const { t } = useI18n();

const positionStore = usePositionStore();

function increaseZoom() {
  positionStore.increaseZoom(dispatcher);
}

function decreaseZoom() {
  positionStore.decreaseZoom(dispatcher);
}
</script>

<template>
  <UButton
    data-testid="zoom-in"
    :title="t('toolbox.zoom.zoomIn')"
    :aria-label="t('toolbox.zoom.zoomIn')"
    :disabled="!positionStore.canIncreaseZoom()"
    color="primary"
    variant="ghost"
    size="sm"
    icon="i-lucide-plus"
    class="hover:bg-primary-50/50 dark:hover:bg-primary-950 dark:hover:text-primary dark:disabled:text-dimmed"
    @click="increaseZoom()"
  />
  <UButton
    data-testid="zoom-out"
    :title="t('toolbox.zoom.zoomOut')"
    :aria-label="t('toolbox.zoom.zoomOut')"
    :disabled="!positionStore.canDecreaseZoom()"
    color="primary"
    variant="ghost"
    size="sm"
    icon="i-lucide-minus"
    class="hover:bg-primary-50/50 dark:hover:bg-primary-950 dark:hover:text-primary dark:disabled:text-dimmed"
    @click="decreaseZoom()"
  />
</template>
