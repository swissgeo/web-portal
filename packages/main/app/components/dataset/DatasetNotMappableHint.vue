<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";

// Tells the user that the map cannot show the dataset. The hint opens on
// hover, tap and keyboard focus of the slot element. The slot element must
// stay focusable, thus it uses aria-disabled and not disabled.
// When the map can show the dataset, the hint does not open.
const { isMappable } = defineProps<{ isMappable: boolean }>();

const { t } = useI18n();
const isOpen = ref(false);
</script>

<template>
  <UPopover
    :open="isOpen && !isMappable"
    mode="hover"
    enable-touch
    :content="{ side: 'top', sideOffset: 8 }"
    @update:open="isOpen = $event"
  >
    <slot />

    <template #content>
      <p
        data-testid="not-mappable-hint"
        class="max-w-48 px-2 py-1 text-xs font-medium text-highlighted"
      >
        {{ t("dataset.notMappable") }}
      </p>
    </template>
  </UPopover>
</template>
