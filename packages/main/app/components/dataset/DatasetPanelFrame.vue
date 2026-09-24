<script setup lang="ts">
const { visible } = defineProps<{ visible: boolean }>();
const snapPoint = ref<number | string | null>(0.7);
const { t } = useI18n();
// The drawer moves below the viewport at the lower snap point.
// Reserve that space so the scroll area still ends at the screen edge.
const contentClass = computed(() => {
  const base =
    "z-50 mt-0 h-dvh max-h-dvh overflow-hidden lg:absolute lg:inset-y-0 lg:right-auto lg:z-20 lg:h-full lg:w-1/2 lg:rounded-none lg:pb-0 lg:transform-none! lg:transition-none";
  if (snapPoint.value === 1) {
    return base;
  }
  return `${base} pb-[30dvh]`;
});
const resizeLabel = computed(() => {
  return snapPoint.value === 1
    ? t("dataset.collapsePanel")
    : t("dataset.expandPanel");
});

function toggleExpanded() {
  snapPoint.value = snapPoint.value === 1 ? 0.7 : 1;
}

watch(
  () => visible,
  () => {
    snapPoint.value = 0.7;
  },
);
</script>

<template>
  <!-- Keep the route outlet mounted while navigation resolves. -->
  <div v-show="visible">
    <ClientOnly>
      <UDrawer
        v-model:active-snap-point="snapPoint"
        :open="true"
        :portal="false"
        :modal="false"
        :overlay="false"
        :dismissible="false"
        :snap-points="[0.7, 1]"
        handle-only
        no-body-styles
        :title="$t('dataset.details')"
        :ui="{
          content: contentClass,
          handle: 'my-2 lg:hidden!',
        }"
      >
        <template #content>
          <button
            class="sr-only focus:not-sr-only lg:hidden"
            :aria-label="resizeLabel"
            @click="toggleExpanded"
          >
            {{ resizeLabel }}
          </button>
          <div class="min-h-0 flex-1">
            <slot />
          </div>
        </template>
      </UDrawer>
      <template #fallback>
        <div class="absolute inset-y-0 left-0 z-20 w-full bg-default lg:w-1/2">
          <slot />
        </div>
      </template>
    </ClientOnly>
  </div>
</template>
