<script setup lang="ts">
import ReportIssueLink from "./ReportIssueLink.vue";

const runtimeConfig = useRuntimeConfig();
const { t } = useI18n();
const { cmsUrl } = useCmsUrl();

defineProps<{ mobile?: boolean }>();

const cmsDomain = runtimeConfig.public.cmsBaseUrl.replace(/https?:\/\//, "");

const REPOSITORY_URL = "https://github.com/swissgeo/web-portal";
// A deployed build has a release tag as version, a local build has a commit hash.
const versionUrl = computed(() => {
  const { version } = runtimeConfig.public;
  return /^v\d+\.\d+\.\d+/.test(version)
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
        :to="runtimeConfig.public.cmsBaseUrl"
        target="_blank"
        raw
        class="flex items-center gap-1"
      >
        {{ cmsDomain }}
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
