<script lang="ts" setup>
import type { TitleComponent } from "@/types";

const { data } = defineProps<{ data: TitleComponent }>();
</script>

<template>
  <ProseH4>{{ data.content.title || "" }}</ProseH4>
</template>
