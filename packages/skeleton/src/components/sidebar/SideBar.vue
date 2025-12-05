<script lang="ts" setup>
import { useUiStore } from "@swissgeo/skeleton";
import LogoPic from "@/components/LogoPic.vue";

const uiStore = useUiStore();

function resetApp() {}
</script>

<template>
  <div class="absolute top-0 left-0 flex h-screen w-auto min-w-12 shadow-lg">
    <div class="flex flex-col">
      <div class="flex shrink-0 justify-center bg-white">
        <LogoPic
          class="h-12"
          @logo-click="resetApp"
          :condensed="!uiStore.isSidebarOpen"
        />
      </div>
    </div>
  </div>
</template>
