<script lang="ts" setup>
import type { TitleComponent } from "@/types";

const { data } = defineProps<{ data: TitleComponent }>();
</script>

<template>
  <ProseH2 class="pt-12 pb-8 first-of-type:pt-2">{{
    data.content?.title || ""
  }}</ProseH2>
</template>
