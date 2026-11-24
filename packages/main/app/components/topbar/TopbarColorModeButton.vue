<script setup lang="ts">
const { size = "sm" } = defineProps<{
  size?: "sm" | "md" | "lg" | "xl";
}>();
</script>

<template>
  <ClientOnly>
    <UColorModeButton
      :size="size"
      :ui="{ base: 'text-accent lg:text-nav-brand-muted lg:px-2.5 lg:py-1.5' }"
    />
  </ClientOnly>
</template>
