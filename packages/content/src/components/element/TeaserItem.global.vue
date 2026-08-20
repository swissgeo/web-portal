<script setup lang="ts">
import type { TeaserItem } from "@content/types";

import { computed } from "vue";

const { data, badge } = defineProps<{
  data: TeaserItem;
  badge?: string;
}>();

const teaser = computed(() => data.content?.resolvedTeaser);
const image = computed(() => {
  if (!teaser.value?.image) {
    return;
  }

  return {
    src: teaser.value.image.url,
    srcset: teaser.value.image.srcSet
      ?.map((source) => `${source.url} ${source.width}w`)
      .join(", "),
    sizes: "(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw",
  };
});
</script>

<template>
  <UBlogPost
    v-if="teaser"
    :title="teaser.title"
    :description="teaser.description"
    :image="image"
    :badge="badge"
    :to="teaser.href"
    variant="outline"
  />
</template>
