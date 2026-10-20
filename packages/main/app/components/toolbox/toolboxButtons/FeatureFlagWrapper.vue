<script setup lang="ts">
defineProps<{
  featureFlagEnabled: boolean;
}>();
</script>

<template>
  <UPopover
    mode="hover"
    enable-touch
    :content="{ side: 'left', sideOffset: 12 }"
  >
    <div>
      <slot :is-disabled="!featureFlagEnabled" />
    </div>

    <template #content v-if="!featureFlagEnabled">
      <div class="max-w-36 px-2 py-1 text-xs font-medium text-highlighted">
        <p>Dieses Tool ist leider noch nicht verfügbar</p>
        <p class="mt-2">Wir sind dran :)</p>
      </div>
    </template>
  </UPopover>
</template>

<style scoped></style>
