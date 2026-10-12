<script setup lang="ts">
import { useResizeObserver } from "@vueuse/core";

const { src, resolution, fullWidth } = defineProps<{
  src: string;
  resolution: { width: number; height: number };
  fullWidth: boolean;
}>();

const PREVIEW_MARGIN = 16;

const previewBox = useTemplateRef("previewBox");
const boxSize = reactive({ width: 0, height: 0 });

useResizeObserver(previewBox, (entries) => {
  const entry = entries[0];
  if (!entry) {
    return;
  }
  boxSize.width = entry.contentRect.width;
  boxSize.height = entry.contentRect.height;
});

const scale = computed(() => {
  const { width, height } = resolution;
  if (!height || !boxSize.height) {
    return 1;
  }
  const availableHeight = Math.max(boxSize.height - PREVIEW_MARGIN * 2, 0);
  if (fullWidth) {
    return Math.min(availableHeight / height, 1);
  }
  if (!width || !boxSize.width) {
    return 1;
  }
  const availableWidth = Math.max(boxSize.width - PREVIEW_MARGIN * 2, 0);
  return Math.min(availableWidth / width, availableHeight / height, 1);
});

const iframeLogicalSize = computed(() => {
  const { width, height } = resolution;
  if (fullWidth && boxSize.width) {
    return { width: boxSize.width / scale.value, height };
  }
  return { width, height };
});

const scaledBoxStyle = computed(() => ({
  width: `${iframeLogicalSize.value.width * scale.value}px`,
  height: `${iframeLogicalSize.value.height * scale.value}px`,
}));

const iframeStyle = computed(() => ({
  width: `${iframeLogicalSize.value.width}px`,
  height: `${iframeLogicalSize.value.height}px`,
  transform: `scale(${scale.value})`,
  transformOrigin: "top left",
}));
</script>

<template>
  <div
    ref="previewBox"
    data-testid="share-embed-preview"
    class="relative h-64 w-full overflow-hidden bg-inverted"
  >
    <div
      class="absolute top-1/2 left-1/2 translate-x-[-50%] translate-y-[-50%] overflow-hidden"
      :style="scaledBoxStyle"
    >
      <iframe
        v-if="src"
        :src="src"
        :style="iframeStyle"
        frameborder="0"
        class="border-0"
        data-testid="share-embed-preview-iframe"
      />
    </div>
    <div
      data-testid="share-embed-preview-label"
      class="absolute inset-0 flex items-center justify-center bg-black/30 text-sm font-semibold text-white"
    >
      {{
        fullWidth
          ? `100% × ${resolution.height}`
          : `${resolution.width} × ${resolution.height}`
      }}
    </div>
  </div>
</template>
