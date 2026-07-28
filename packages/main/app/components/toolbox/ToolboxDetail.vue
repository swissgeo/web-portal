<script setup lang="ts">
import ToolboxShare from "@/components/toolbox/share/Share.vue";
import { useToolboxStore } from "@/stores/toolbox";

const toolboxStore = useToolboxStore();
</script>

<template>
  <div
    v-if="toolboxStore.activeDetailPanel"
    class="absolute top-0 right-24 w-96"
  >
    <ToolboxShare v-if="toolboxStore.isPanelActive('share')" />
  </div>
</template>
