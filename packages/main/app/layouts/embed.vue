<script lang="ts" setup>
import { displayModeKey } from "~/types/injectionKeys";
import { provide } from "vue";

provide(displayModeKey, "embed");
</script>

<template>
  <div class="flex h-dvh w-screen flex-col font-sans">
    <TestSiteBanner />
    <main ref="main" class="relative min-h-0 flex-1">
      <slot />
    </main>
  </div>
</template>
