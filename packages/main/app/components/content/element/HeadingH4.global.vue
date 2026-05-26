<script lang="ts" setup>
import type { TitleComponent } from "@swissgeo/shared/livingdocs";

const { data } = defineProps<{ data: TitleComponent }>();
</script>

<template>
  <h4>{{ data.content.title || "" }}</h4>
</template>
