<script lang="ts" setup>
import type { TitleComponent } from "#types/index";

const { data } = defineProps<{ data: TitleComponent }>();
</script>

<template>
  <div>
    <ProseH1 class="pb-8 text-primary">{{ data.content.title || "" }}</ProseH1>
  </div>
</template>
