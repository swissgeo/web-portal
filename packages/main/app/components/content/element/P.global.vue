<script lang="ts" setup>
import type { ContentItem } from "~~/shared/types/livingdocs/Page";

const { data } = defineProps<{ data: ContentItem }>();
</script>

<template>
    <p class="mb-4">
        {{ data.content?.text }}
    </p>
</template>
