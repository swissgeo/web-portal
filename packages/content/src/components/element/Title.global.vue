<script lang="ts" setup>
import type { TitleComponent } from "@content/types";

import { computed } from "vue";

const { data } = defineProps<{ data: TitleComponent }>();

const titleParts = computed(() => {
  const title = data.content.title || "";
  const separatorIndex = title.indexOf(":");

  if (separatorIndex < 0) {
    return {
      eyebrow: "",
      title,
    };
  }

  return {
    eyebrow: title.slice(0, separatorIndex).trim(),
    title: title.slice(separatorIndex + 1).trim(),
  };
});
</script>

<template>
  <div class="mx-auto max-w-[1227px]">
    <p
      v-if="titleParts.eyebrow"
      class="pb-2.5 font-editorial text-lg leading-normal font-semibold text-default"
    >
      {{ titleParts.eyebrow }}
    </p>
    <h1
      class="pb-8 font-stage text-5xl leading-none font-semibold tracking-[0.01em] text-default 2xl:text-[80px]"
    >
      {{ titleParts.title }}
    </h1>
  </div>
</template>
