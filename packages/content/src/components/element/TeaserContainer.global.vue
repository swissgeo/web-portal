<script setup lang="ts">
import type { TeaserContainer } from "@content/types";

import { computed } from "vue";

const { data } = defineProps<{ data: TeaserContainer }>();

const teaserItems = computed(() => data.containers?.teaserItems ?? []);
</script>

<template>
  <section v-if="teaserItems.length" class="mb-16">
    <h2
      v-if="data.content?.teaserTitle"
      class="mb-8 pt-0 pb-0 font-editorial text-2xl leading-[1.2] font-medium text-highlighted"
    >
      {{ data.content.teaserTitle }}
    </h2>
    <ContentRenderer
      :containers="teaserItems"
      class="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
    />
  </section>
</template>
