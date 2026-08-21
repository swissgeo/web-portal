<script lang="ts" setup>
import { useDraggable } from "@vueuse/core";

import FeatureInfo from "@/components/featuresinfo/FeatureInfo.vue";

const { t } = useI18n();

const draggableContainer = useTemplateRef("container");
const dragHandle = useTemplateRef<HTMLDivElement>("dragHandle");

const { style } = useDraggable(draggableContainer, {
  initialValue: { x: 200, y: 200 },
  handle: dragHandle,
  onStart: (_position, event) => {
    if ((event.target as HTMLElement).closest("button")) {
      return false;
    }
  },
});
const emit = defineEmits<{
  close: [];
}>();
const isCollapsed = ref(false);
function toggleContent() {
  isCollapsed.value = !isCollapsed.value;
}
</script>
<template>
  <div ref="container" class="fixed z-50" :style="style">
    <UCard :ui="{ header: 'cursor-grab active:cursor-grabbing select-none' }">
      <template #header>
        <div ref="dragHandle" class="flex items-center justify-between">
          <span class="font-semibold text-highlighted">{{
            t("featureInfo.popupTitle")
          }}</span>
          <UButton
            :icon="
              isCollapsed ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'
            "
            color="neutral"
            variant="ghost"
            square
            size="xs"
            @click="toggleContent"
          /><UButton
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            square
            size="xs"
            @click="emit('close')"
          />
        </div>
      </template>
      <div v-show="!isCollapsed"><FeatureInfo /></div>
    </UCard>
  </div>
</template>
