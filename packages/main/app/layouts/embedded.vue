<script lang="ts" setup>
import { provide } from "vue";

provide<"web" | "print" | "embedded">("displayMode", "embedded");
</script>

<template>
  <main ref="main" class="h-screen w-screen font-sans">
    <slot />
  </main>
</template>
