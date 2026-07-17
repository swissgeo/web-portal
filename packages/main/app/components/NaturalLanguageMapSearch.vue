<script setup lang="ts">
import type { NaturalLanguageLayerSuggestion } from "@/composables/useNaturalLanguageMapSearch.client";

const query = ref("");
const { locale } = useI18n();
const { chooseLayer, isRunning, run, status, suggestions } =
  useNaturalLanguageMapSearch();

function submit() {
  void run(query.value, locale.value);
}

function choose(suggestion: NaturalLanguageLayerSuggestion) {
  void chooseLayer(suggestion, locale.value);
}
</script>

<template>
  <div
    class="pointer-events-auto fixed top-4 left-1/2 z-4 w-[min(42rem,calc(100vw-7rem))] -translate-x-1/2 rounded-lg bg-white p-2 shadow-lg"
    data-testid="natural-language-map-search"
  >
    <form class="flex gap-2" @submit.prevent="submit">
      <UInput
        v-model="query"
        class="w-full"
        placeholder="Try: Can I add solar panels to my house?"
        autocomplete="off"
        data-testid="natural-language-map-search-input"
      />
      <UButton type="submit" :loading="isRunning" :disabled="query.length < 3">
        Go
      </UButton>
    </form>
    <p v-if="status" class="mt-1 px-1 text-xs text-muted" aria-live="polite">
      {{ status }}
    </p>
    <ul
      v-if="suggestions.length > 0"
      class="mt-2 grid gap-1"
      aria-label="Alternative catalog layers"
    >
      <li v-for="suggestion in suggestions" :key="suggestion.id">
        <UButton
          type="button"
          color="neutral"
          variant="soft"
          size="xs"
          block
          :disabled="isRunning"
          class="justify-between"
          @click="choose(suggestion)"
        >
          <span class="truncate">{{ suggestion.title }}</span>
          <span class="ml-2 font-mono tabular-nums">
            {{ suggestion.score.toFixed(2) }}
          </span>
        </UButton>
      </li>
    </ul>
  </div>
</template>
