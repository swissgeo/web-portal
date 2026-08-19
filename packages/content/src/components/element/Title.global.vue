<script lang="ts" setup>
import type { TitleComponent } from "@content/types";

const { data } = defineProps<{ data: TitleComponent }>();
</script>

<template>
  <div class="mx-auto max-w-[1227px]">
    <h1 class="type-content-hero-title">{{ data.content.title || "" }}</h1>
  </div>
</template>
