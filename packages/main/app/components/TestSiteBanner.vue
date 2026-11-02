<script setup lang="ts">
import { useCssVar, useElementSize } from "@vueuse/core";

import { useEnvironment } from "@/composables/useEnvironment";

const { t } = useI18n();

// Each test staging has its own color, so users can tell DEV, INT and a PR preview apart.
// The theme has no purple color, so the PR preview sets its background directly.
const bannerStyles = {
  dev: { color: "error", root: "", text: "text-error-on-accent" },
  int: { color: "warning", root: "", text: "text-warning-on-accent" },
  preview: { color: "neutral", root: "bg-purple-800", text: "text-white" },
  prod: undefined, // on prod, there is no banner
} as const;

const { environment } = useEnvironment();

// Local dev reuses the DEV banner
const bannerEnvironment = environment === "local" ? "dev" : environment;

const bannerStyle = bannerStyles[bannerEnvironment];

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
    :title="
      t('testSiteBanner.text', { environment: bannerEnvironment.toUpperCase() })
    "
    :ui="{
      root: bannerStyle.root,
      container: 'h-auto py-4',
      center: 'gap-2.5',
      icon: bannerStyle.text,
      title: `font-semibold leading-snug text-balance whitespace-normal ${bannerStyle.text}`,
    }"
  />
</template>
