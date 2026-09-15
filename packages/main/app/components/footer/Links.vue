<script setup lang="ts">
const runtimeConfig = useRuntimeConfig();
</script>
<template>
  <div class="flex w-fit flex-row items-center gap-8 pr-3">
    <ULink target="_blank" raw class="flex items-center gap-1"
      >Report issue</ULink
    >
    <ULink
      to="https://github.com/swissgeo/web-portal"
      target="_blank"
      raw
      class="flex items-center gap-1"
    >
      <UIcon name="i-lucide-github" class="size-3 shrink-0" />
      {{ runtimeConfig.public.version }}
    </ULink>
    <ULink
      to="https://geo.admin.ch"
      target="_blank"
      raw
      class="flex items-center gap-1"
      >geo.admin.ch</ULink
    >
    <ULink target="_blank" raw class="flex items-center gap-1"
      >Nutzungsbedingungen</ULink
    >
    <ULink target="_blank" raw class="flex items-center gap-1">Impressum</ULink>
  </div>
</template>
