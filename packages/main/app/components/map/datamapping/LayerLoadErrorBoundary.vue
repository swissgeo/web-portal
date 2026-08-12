<script setup lang="ts">
// Stops the failed converter after its first error; the parent owns all effects.
const failed = ref(false);

const emit = defineEmits<{
  error: [error: unknown];
}>();

onErrorCaptured((error) => {
  if (!failed.value) {
    failed.value = true;
    emit("error", error);
  }
  return false;
});
</script>

<template>
  <slot v-if="!failed" />
</template>
