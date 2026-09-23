<script lang="ts" setup>
import { displayModeKey } from "~/types/injectionKeys";
const toaster = {
  position: "top-center" as const,
  progress: false,
  duration: Infinity,
};
provide(displayModeKey, "web");
</script>

<template>
  <UApp :toaster="toaster">
    <NuxtPage />
  </UApp>
</template>
