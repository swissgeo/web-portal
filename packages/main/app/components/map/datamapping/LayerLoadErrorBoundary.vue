<script setup lang="ts">
// Stops rendering a failed layer converter and reports only its first error.
// The parent owns logging, user feedback, and layer cleanup.
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
