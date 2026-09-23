<script setup lang="ts">
import ReportIssueLink from "./ReportIssueLink.vue";
const runtimeConfig = useRuntimeConfig();
const { t } = useI18n();
</script>
<template>
  <div class="flex flex-col gap-4 px-4 pb-20">
    <ReportIssueLink />
    <div class="text-accent grid grid-cols-2 gap-2">
      <ULink
        to="https://github.com/swissgeo/web-portal"
        target="_blank"
        raw
        class="flex items-center gap-1 md:hidden xl:flex"
      >
        <UIcon name="i-lucide-github" class="size-3 shrink-0" />
        {{ runtimeConfig.public.version }}
      </ULink>
      <ULink
        to="https://geo.admin.ch"
        target="_blank"
        raw
        class="flex items-center gap-1 md:hidden xl:flex"
      >
        geo.admin.ch
      </ULink>
      <ULink
        target="_blank"
        raw
        class="flex items-center gap-1 md:hidden xl:flex"
      >
        {{ t("footer.termsOfUse") }}
      </ULink>
      <ULink
        target="_blank"
        raw
        class="flex items-center gap-1 md:hidden xl:flex"
      >
        {{ t("footer.impressum") }}
      </ULink>
    </div>
  </div>
</template>
