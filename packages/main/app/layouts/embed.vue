<script lang="ts" setup>
import { displayModeKey } from "~/types/injectionKeys";
import { provide } from "vue";

provide(displayModeKey, "embed");
</script>

<template>
  <main ref="main" class="h-screen w-screen font-sans">
    <slot />
  </main>
</template>
