<script setup lang="ts">
// Adapted from web-mapviewer SearchResultListEntry.vue

import type { SearchResult } from "@swissgeo/search";

import { isLayerSearchResult, SearchResultTypesEnum } from "@swissgeo/search";
import { sanitizeHtml } from "@swissgeo/shared";
import { useSearchStore } from "@swissgeo/skeleton";
import { escapeRegExp } from "es-toolkit";
import { computed, ref, useId } from "vue";
import { useI18n } from "vue-i18n";

const localePath = useLocalePath();
const { t } = useI18n();
const searchStore = useSearchStore();

const {
  index,
  entry,
  tabStart = false,
} = defineProps<{
  index: number;
  entry: SearchResult;
  tabStart: boolean;
}>();

const emit = defineEmits<{
  select: [];
  viewDetails: [];
  firstEntryReached: [];
  lastEntryReached: [];
}>();

const item = ref<HTMLLIElement>();

// Marks the typed words in the title, as the design does. Only the text nodes
// are searched, so the markup of the title stays intact.
const highlightedTitle = computed(() => {
  const html = sanitizeHtml(entry.title);
  const words = searchStore.query.split(/\s+/).filter(Boolean);
  if (!words.length) {
    return html;
  }
  const pattern = new RegExp(`(${words.map(escapeRegExp).join("|")})`, "gi");
  const { body } = new DOMParser().parseFromString(html, "text/html");
  const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
  const texts: Text[] = [];
  while (walker.nextNode()) {
    texts.push(walker.currentNode as Text);
  }
  for (const text of texts) {
    // split keeps the matches at the odd indexes
    const parts = text.data.split(pattern);
    if (parts.length > 1) {
      text.replaceWith(
        ...parts.map((part, i) => {
          if (i % 2 === 0) {
            return part;
          }
          const mark = document.createElement("mark");
          mark.textContent = part;
          return mark;
        }),
      );
    }
  }
  return body.innerHTML;
});
const detailPath = computed(() => localePath(`/dataset/${entry.id}`));
// Only layer results go on the map, so only they can be not mappable
const isMappable = computed(
  () => !isLayerSearchResult(entry) || entry.isMappable,
);
const hintId = useId();

// What selecting the result does is not obvious from the landing page
const tooltip = computed(() => {
  if (isLayerSearchResult(entry)) {
    return entry.isMappable ? t("dataset.addToMap") : undefined;
  }
  if (entry.resultType === "LOCATION") {
    return t("search.jumpToLocation");
  }
  if (entry.resultType === "FEATURE") {
    return t("search.jumpToFeature");
  }
  return undefined;
});

// Keyboard navigation
function goToFirst() {
  if (!item.value) {
    return;
  }
  const firstItem = item.value.parentElement
    ?.firstElementChild as HTMLLIElement;
  firstItem?.focus();
}

function goToPrevious() {
  if (!item.value) {
    return;
  }
  if (item.value.previousElementSibling) {
    (item.value.previousElementSibling as HTMLLIElement).focus();
  } else {
    emit("firstEntryReached");
  }
}

function goToNext() {
  if (!item.value) {
    return;
  }
  if (item.value.nextElementSibling) {
    (item.value.nextElementSibling as HTMLLIElement).focus();
  } else {
    emit("lastEntryReached");
  }
}

function goToLast() {
  if (!item.value?.parentElement) {
    return;
  }
  const lastItem = item.value.parentElement.lastElementChild as HTMLLIElement;
  lastItem?.focus();
}

// Selection handler
function selectItem() {
  if (isMappable.value) {
    emit("select");
  }
}

defineExpose({
  // Expose methods for parent to call
  goToFirst,
  goToLast,
});
</script>

<template>
  <!-- List item with keyboard navigation -->
  <DatasetNotMappableHint :show-hint="!isMappable">
    <li
      ref="item"
      class="flex items-center gap-2 px-2 py-1 text-sm leading-small-text font-medium transition-colors focus:outline-none focus-visible:bg-elevated"
      :class="
        isMappable
          ? 'text-accent cursor-pointer hover:bg-muted focus-visible:text-highlighted'
          : 'cursor-not-allowed text-muted'
      "
      :aria-describedby="isMappable ? undefined : hintId"
      :data-testid="`search-result-entry-${entry.resultType.toLowerCase()}-${index}`"
      :tabindex="tabStart ? 0 : -1"
      @keydown.up.prevent="goToPrevious"
      @keydown.down.prevent="goToNext"
      @keydown.home.prevent="goToFirst"
      @keydown.end.prevent="goToLast"
      @keyup.enter="selectItem"
      @click="selectItem"
    >
      <!-- Title, it holds the tooltip so that the info button's one never
        overlaps it -->
      <ClientOnly>
        <UTooltip :text="tooltip">
          <!-- the design marks only the typed text, not the name the
            location search wraps in <b> -->
          <!-- eslint-disable vue/no-v-html -->
          <div
            class="min-w-0 flex-1 truncate [&_b]:font-medium [&_mark]:rounded-[1px] [&_mark]:bg-salmon-200 [&_mark]:py-px [&_mark]:text-salmon-950"
            v-html="highlightedTitle"
          />
          <!-- eslint-enable vue/no-v-html -->
        </UTooltip>
      </ClientOnly>

      <!-- Layer info button, the negative margins keep the row height -->
      <UTooltip
        v-if="entry.resultType === SearchResultTypesEnum.layer"
        :text="t('search.viewDataset')"
      >
        <UButton
          class="-my-1 -mr-1"
          :data-testid="`search-result-info-${index}`"
          :aria-label="t('search.viewDataset')"
          icon="i-lucide-info"
          color="primary"
          variant="ghost"
          size="xs"
          :to="detailPath"
          @click.stop="emit('viewDetails')"
          @keyup.enter.stop
        />
      </UTooltip>
      <span v-if="!isMappable" :id="hintId" class="sr-only">
        {{ t("dataset.notMappable") }}
      </span>
    </li>
  </DatasetNotMappableHint>
</template>
