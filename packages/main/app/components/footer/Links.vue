<script setup lang="ts">
import ReportIssueLink from "./ReportIssueLink.vue";
const runtimeConfig = useRuntimeConfig();
const { t } = useI18n();

defineProps<{ mobile?: boolean }>();
</script>
<template>
  <div
    :class="
      mobile
        ? 'flex flex-col gap-4 px-4 pb-20'
        : 'flex w-fit flex-row flex-wrap items-center justify-end gap-x-4 gap-y-2 pr-3'
    "
  >
    <ReportIssueLink />
    <div :class="mobile ? 'text-accent grid grid-cols-2 gap-2' : 'contents'">
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
      >
        geo.admin.ch
      </ULink>
      <ULink target="_blank" raw class="flex items-center gap-1">
        {{ t("footer.termsOfUse") }}
      </ULink>
      <ULink target="_blank" raw class="flex items-center gap-1">
        {{ t("footer.impressum") }}
      </ULink>
    </div>
  </div>
</template>
