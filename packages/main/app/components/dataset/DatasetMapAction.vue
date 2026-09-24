<script setup lang="ts">
defineProps<{
  hasDataset: boolean;
  isAlreadyOnMap: boolean;
}>();

const emit = defineEmits<{ "add-to-map": [] }>();
</script>

<template>
  <div class="shrink-0" data-testid="dataset-map-action">
    <UButton
      v-if="hasDataset && !isAlreadyOnMap"
      icon="i-lucide-check"
      color="primary"
      variant="outline"
      @click="emit('add-to-map')"
    >
      {{ $t("dataset.addToMap") }}
    </UButton>
    <div
      v-else-if="hasDataset && isAlreadyOnMap"
      class="flex items-center gap-2 text-sm text-muted"
    >
      <UIcon name="i-lucide-check" class="size-4" />
      {{ $t("dataset.alreadyOnMap") }}
    </div>
  </div>
</template>
