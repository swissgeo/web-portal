<script lang="ts" setup>
import type { Image } from "@swissgeo/shared/livingdocs";

import { isImage } from "@swissgeo/shared/livingdocs";

const { data } = defineProps<{ data: Image }>();
const imageUrl = computed(() => {
  if (!isImage(data)) {
    return "";
  }
  const image = data.content?.image;
  return image;
});

const caption = computed(() => {
  if (!isImage(data)) {
    return "";
  }
  return data.content?.caption || "";
});
</script>

<template>
  <figure>
    <picture>
      <img :src="imageUrl" class="max-w-[756px]" />
    </picture>
    <figcaption>{{ caption }}</figcaption>
  </figure>
</template>
