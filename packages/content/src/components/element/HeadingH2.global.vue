<script lang="ts" setup>
import type { TitleComponent } from "@/types";

const { data } = defineProps<{ data: TitleComponent }>();
</script>

<template>
  <ProseH2>{{ data.content?.title || "" }}</ProseH2>
</template>
