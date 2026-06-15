<script lang="ts" setup>
import type { TitleComponent } from "@/types";

const { data } = defineProps<{ data: TitleComponent }>();
</script>

<template>
  <div>
    <h1>{{ data.content.title || "" }}</h1>
  </div>
</template>
