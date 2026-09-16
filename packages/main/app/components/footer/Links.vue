<script setup lang="ts">
import ReportIssueLink from "./ReportIssueLink.vue";
const runtimeConfig = useRuntimeConfig();
</script>
<template>
  <div class="flex w-fit flex-row items-center gap-8 pr-3">
    <ReportIssueLink />
    <ULink
      to="https://github.com/swissgeo/web-portal"
      target="_blank"
      raw
      class="hidden items-center gap-1 xl:flex"
    >
      <UIcon name="i-lucide-github" class="size-3 shrink-0" />
      {{ runtimeConfig.public.version }}
    </ULink>
    <ULink
      to="https://geo.admin.ch"
      target="_blank"
      raw
      class="hidden items-center gap-1 xl:flex"
    >
      geo.admin.ch
    </ULink>
    <ULink target="_blank" raw class="hidden items-center gap-1 xl:flex">
      Nutzungsbedingungen
    </ULink>
    <ULink target="_blank" raw class="hidden items-center gap-1 xl:flex">
      Impressum
    </ULink>
  </div>
</template>
