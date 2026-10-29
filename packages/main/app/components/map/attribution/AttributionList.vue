<script setup lang="ts">
import type { AttributionSource } from "@/composables/useAttributionSources";

const { sources } = defineProps<{
  sources: AttributionSource[];
}>();

const { t } = useI18n();
</script>

<template>
  <!-- z-1 keeps it above the map but behind the side panel (z-10) -->
  <div
    v-if="sources.length > 0"
    class="text-accent fixed right-0 bottom-16 z-1 rounded-tl-lg bg-muted/70 px-2 py-1 text-right text-xs backdrop-blur-sm md:bottom-9"
    data-testid="layers-copyrights"
  >
    <span>{{ t("footer.copyRightData") }}</span>
    <template v-for="(source, index) in sources" :key="source.abbreviation">
      <a
        v-if="source.url"
        :href="source.url"
        :title="source.name"
        target="_blank"
        :data-testid="`layer-copyright-${source.abbreviation}`"
        >{{ source.abbreviation }}</a
      ><span
        v-else
        :title="source.name"
        :data-testid="`layer-copyright-${source.abbreviation}`"
        >{{ source.abbreviation }}</span
      >{{ index < sources.length - 1 ? ", " : "" }}
    </template>
  </div>
</template>
