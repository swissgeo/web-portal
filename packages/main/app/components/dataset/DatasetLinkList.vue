<script lang="ts" setup>
import type { Link } from "@swissgeo/ogc";

defineProps<{
  links: Link[];
}>();
</script>

<template>
  <ul class="flex flex-col gap-2">
    <li v-for="link in links" :key="link.href">
      <ULink
        :to="link.href"
        target="_blank"
        raw
        class="inline-flex max-w-full items-baseline gap-1"
      >
        <UIcon name="i-lucide-external-link" class="size-3 shrink-0" />
        <span class="wrap-anywhere">{{ link.title ?? link.href }}</span>
      </ULink>
    </li>
  </ul>
</template>
