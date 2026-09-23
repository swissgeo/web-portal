<script setup lang="ts">
defineProps<{
  hasDataset: boolean;
  isAlreadyOnMap: boolean;
}>();

const emit = defineEmits<{ "add-to-map": [] }>();
</script>

<template>
  <footer class="flex flex-wrap gap-space-s border-t border-default p-space-m">
    <UButton
      v-if="hasDataset && !isAlreadyOnMap"
      icon="i-lucide-map"
      color="primary"
      class="w-full justify-center"
      @click="emit('add-to-map')"
    >
      {{ $t("dataset.addToMap") }}
    </UButton>
    <div
      v-else-if="hasDataset && isAlreadyOnMap"
      class="flex w-full items-center justify-center gap-2 text-sm text-muted"
    >
      <UIcon name="i-lucide-check" class="size-4" />
      {{ $t("dataset.alreadyOnMap") }}
    </div>
  </footer>
</template>
