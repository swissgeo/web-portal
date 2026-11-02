<script setup lang="ts">
import type { ActionDispatcher } from "@swissgeo/shared/action-dispatcher";

import { usePositionStore } from "@swissgeo/map";

import ToolBoxButton from "@/components/toolbox/toolboxButtons/ToolBoxButton.vue";

const dispatcher: ActionDispatcher = { name: "ZoomButtons.vue" };

const positionStore = usePositionStore();

function increaseZoom() {
  positionStore.increaseZoom(dispatcher);
}

function decreaseZoom() {
  positionStore.decreaseZoom(dispatcher);
}
</script>

<template>
  <ToolBoxButton
    data-testid="zoom-in"
    title="Zoom in"
    :is-disabled="!positionStore.canIncreaseZoom()"
    :is-active="false"
    iconName="Plus"
    @click="increaseZoom()"
  /><ToolBoxButton
    data-testid="zoom-out"
    title="Zoom out"
    :is-disabled="!positionStore.canDecreaseZoom()"
    :is-active="false"
    iconName="Minus"
    @click="decreaseZoom()"
  />
</template>

<style scoped></style>
