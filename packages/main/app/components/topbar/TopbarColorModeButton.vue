<script setup lang="ts">
const { size = "sm" } = defineProps<{
  size?: "sm" | "md" | "lg" | "xl";
}>();
</script>

<template>
  <ClientOnly>
    <UColorModeButton
      :size="size"
      :ui="{ base: 'text-accent xl:text-nav-brand-muted' }"
    />
  </ClientOnly>
</template>
