<!-- eslint multi-word: off-->
<script lang="ts" setup>
import { provide } from "vue";

provide<"web" | "print">("displayMode", "print");
</script>

<template>
  <main ref="main" class="fitting-content font-sans">
    <slot />
  </main>
</template>

<style lang="css" scoped>
.fitting-content {
  width: fit-content;
  height: fit-content;
}
</style>
