<script setup lang="ts">
import type { NaturalLanguageLayerSuggestion } from "@/composables/useNaturalLanguageMapSearch.client";

const query = ref("");
const { locale } = useI18n();
const {
  chooseLayer,
  isRunning,
  loadModel,
  modelLoadState,
  run,
  status,
  suggestions,
} = useNaturalLanguageMapSearch();

const isModelLoading = computed(() => modelLoadState.value === "loading");
const isModelReady = computed(() => modelLoadState.value === "ready");

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
    <UButton
      type="button"
      :loading="isModelLoading"
      :disabled="isModelLoading || isModelReady"
      data-testid="natural-language-map-search-load-model"
      @click="loadModel"
    >
      {{ isModelReady ? "Model ready" : "Load model" }}
    </UButton>
    <form class="mt-2 flex gap-2" @submit.prevent="submit">
      <UInput
        v-model="query"
        class="w-full"
        :disabled="!isModelReady"
        placeholder="Try: Can I add solar panels to my house?"
        autocomplete="off"
        data-testid="natural-language-map-search-input"
      />
      <UButton
        type="submit"
        :loading="isRunning"
        :disabled="!isModelReady || query.trim().length < 3"
        data-testid="natural-language-map-search-submit"
      >
        Go
      </UButton>
    </form>
    <p
      v-if="status"
      class="mt-1 px-1 text-xs text-muted"
      aria-live="polite"
      :role="modelLoadState === 'error' ? 'alert' : 'status'"
    >
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
