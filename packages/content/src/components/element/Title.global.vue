<script lang="ts" setup>
import type { TitleComponent } from "@content/types";

const { data } = defineProps<{ data: TitleComponent }>();
</script>

<template>
  <h1 class="type-content-hero-title">{{ data.content.title || "" }}</h1>
</template>
