<script lang="ts" setup>
import type { NuxtError } from "#app";

const props = defineProps<{
  error: NuxtError;
}>();

const i18n = useI18n();
const localePath = useLocalePath();

const message = computed(() => {
  if (props.error.status === 404) {
    const resourceKey = `error.resources.${props.error.message}`;
    const resource = i18n.te(resourceKey)
      ? i18n.t(resourceKey)
      : i18n.t("error.resources.dataset");
    return i18n.t("error.notFound", { resource });
  }
  return i18n.t("error.generic");
});

function handleError() {
  void clearError({ redirect: localePath("/map") });
}
</script>

<template>
  <div
    class="flex h-screen flex-col items-center justify-center gap-6 p-8 text-center"
  >
    <p class="text-6xl font-bold text-muted">
      {{ error.status }}
    </p>
    <p class="text-lg">
      {{ message }}
    </p>
    <UButton
      icon="i-lucide-arrow-left"
      color="neutral"
      variant="subtle"
      @click="handleError"
    >
      {{ $t("error.backToMap") }}
    </UButton>
  </div>
</template>
