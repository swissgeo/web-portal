<script lang="ts" setup>
import type { TitleComponent } from "#types/index";

const { data } = defineProps<{ data: TitleComponent }>();
</script>

<template>
  <ProseH3>{{ data.content.title || "" }}</ProseH3>
</template>
