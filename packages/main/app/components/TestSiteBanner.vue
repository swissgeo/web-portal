<script setup lang="ts">
const { t } = useI18n();

// Each test staging has its own color, so users can tell DEV from INT.
const bannerStyles = {
  dev: { color: "error", text: "text-error-on-accent" },
  int: { color: "warning", text: "text-warning-on-accent" },
} as const;

const isTestSite = (value: string): value is keyof typeof bannerStyles =>
  Object.hasOwn(bannerStyles, value);

const testSite = useRuntimeConfig().public.testSiteBanner;
const bannerStyle = isTestSite(testSite) ? bannerStyles[testSite] : undefined;
</script>

<template>
  <UBanner
    v-if="bannerStyle"
    data-testid="test-site-banner"
    :color="bannerStyle.color"
    icon="i-lucide-code-xml"
    :title="t('testSiteBanner.text', { environment: testSite.toUpperCase() })"
    :ui="{
      container: 'h-auto py-4',
      center: 'gap-2.5',
      icon: bannerStyle.text,
      title: `font-semibold leading-snug text-balance whitespace-normal ${bannerStyle.text}`,
    }"
  />
</template>
