<script lang="ts" setup>
import { provide } from "vue";

provide<"web" | "print" | "embed">("displayMode", "embed");
</script>

<template>
  <main ref="main" class="h-screen w-screen font-sans">
    <slot />
  </main>
</template>
