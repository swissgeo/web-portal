<script setup lang="ts">
import ReportIssueLink from "./ReportIssueLink.vue";

const runtimeConfig = useRuntimeConfig();
const { t } = useI18n();
const { cmsUrl } = useCmsUrl();

defineProps<{ mobile?: boolean }>();

const REPOSITORY_URL = "https://github.com/swissgeo/web-portal";
// Only an exact release tag has a release page. A build between two tags
// (for example v0.9.0-beta.2-2-g4e9f735f) or a commit hash opens the repository.
const versionUrl = computed(() => {
  const { version } = runtimeConfig.public;
  return /^v\d+\.\d+\.\d+(-[a-z]+\.\d+)?$/.test(version)
    ? `${REPOSITORY_URL}/releases/tag/${version}`
    : REPOSITORY_URL;
});
</script>
<template>
  <div
    :class="
      mobile
        ? 'flex flex-col gap-4 pb-20 text-tiny'
        : 'flex w-fit flex-row flex-wrap items-center justify-end gap-x-4 gap-y-2 pr-3'
    "
  >
    <ReportIssueLink />
    <div :class="mobile ? 'text-accent grid grid-cols-2 gap-2' : 'contents'">
      <ULink
        :to="versionUrl"
        data-testid="footer-version-link"
        target="_blank"
        raw
        class="flex items-center gap-1"
      >
        <UIcon name="i-lucide-github" class="size-3 shrink-0" />
        {{ runtimeConfig.public.version }}
      </ULink>
      <ULink
        target="_blank"
        :to="cmsUrl(t('landing.links.termsOfUse'))"
        raw
        class="flex items-center gap-1"
      >
        {{ t("footer.termsOfUse") }}
      </ULink>
      <ULink
        target="_blank"
        :to="cmsUrl(t('landing.links.impressum'))"
        raw
        class="flex items-center gap-1"
      >
        {{ t("footer.impressum") }}
      </ULink>
    </div>
  </div>
</template>
