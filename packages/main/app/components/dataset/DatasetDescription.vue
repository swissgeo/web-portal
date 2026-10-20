<script lang="ts" setup>
import { sanitizeHtml } from "~/utils/sanitize";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

const { description } = defineProps<{ description: string }>();

const { t } = useI18n();
const isDesktop = useIsDesktop();
const isExpanded = ref(false);

const limit = computed(() => (isDesktop.value ? 1500 : 400));
// The OAR sends the HTML escaped (`&lt;a …&gt;`), so decode it first.
// `&lt;https://…&gt;` is a bare URL, not a tag: keep it as text.
const decoded = computed(() =>
  toText(description.replace(/&lt;(https?:\/\/\S+?)&gt;/g, "$1")),
);
const html = computed(() =>
  sanitizeHtml(decoded.value, t("featureInfo.blockedContent")),
);
const text = computed(() => toText(html.value));
const isTruncated = computed(
  () => !isExpanded.value && text.value.length > limit.value,
);

function toText(value: string): string {
  return (
    new DOMParser().parseFromString(value, "text/html").body.textContent ?? ""
  );
}
</script>

<template>
  <!-- eslint-disable vue/no-v-html -- sanitizeHtml cleans the HTML -->
  <!-- DOMParser and DOMPurify need the browser. -->
  <ClientOnly>
    <div class="flex flex-col items-start gap-space-xs">
      <p
        v-if="isTruncated"
        class="text-base leading-small-text wrap-anywhere whitespace-pre-line text-default"
        data-testid="dataset-description"
      >
        {{ `${text.slice(0, limit).trimEnd()}…` }}
      </p>
      <div
        v-else
        class="text-base leading-small-text wrap-anywhere whitespace-pre-line text-default [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:ps-5"
        data-testid="dataset-description"
        v-html="html"
      />
      <UButton
        v-if="isTruncated"
        color="primary"
        variant="ghost"
        icon="i-lucide-chevron-down"
        :label="t('dataset.readMore')"
        data-testid="dataset-description-read-more"
        @click="isExpanded = true"
      />
    </div>
    <template #fallback>
      <USkeleton class="h-24 w-full" />
    </template>
  </ClientOnly>
</template>
