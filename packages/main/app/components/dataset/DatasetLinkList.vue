<script lang="ts" setup>
import type { Link } from "@swissgeo/ogc";

defineProps<{
  links: Link[];
  label?: string;
  tooltip?: string;
}>();
</script>

<template>
  <ul class="flex flex-col gap-2">
    <li v-for="link in links" :key="link.href">
      <UTooltip :text="tooltip">
        <ULink
          :to="link.href"
          target="_blank"
          raw
          class="flex w-full items-center justify-between gap-space-s rounded-md border border-accented px-space-xs py-4 text-sm font-bold text-highlighted"
        >
          <span class="wrap-anywhere">{{
            label ?? link.title ?? link.href
          }}</span>
          <UIcon
            name="i-lucide-external-link"
            class="size-5 shrink-0 text-primary"
          />
        </ULink>
      </UTooltip>
    </li>
  </ul>
</template>
