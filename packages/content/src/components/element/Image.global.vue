<script lang="ts" setup>
import { computed } from "vue";

import type { Image } from "@/types";

import { isImage } from "@/utils";

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
