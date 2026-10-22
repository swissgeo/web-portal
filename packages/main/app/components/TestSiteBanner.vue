<script setup lang="ts">
import { useCssVar, useElementSize } from "@vueuse/core";

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

// The mobile drawer reads this height to stay below the topbar.
const banner = useTemplateRef("banner");
const { height } = useElementSize(() => banner.value?.$el, undefined, {
  box: "border-box",
});
const bannerHeight = useCssVar("--test-site-banner-height");
watch(height, (value) => {
  bannerHeight.value = `${value}px`;
});
</script>

<template>
  <UBanner
    v-if="bannerStyle"
    ref="banner"
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
