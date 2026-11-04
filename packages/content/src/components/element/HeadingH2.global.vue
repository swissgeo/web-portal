<script lang="ts" setup>
import type { TitleComponent } from "#types/index";

const { data } = defineProps<{ data: TitleComponent }>();
</script>

<template>
  <ProseH2>{{ data.content?.title || "" }}</ProseH2>
</template>
