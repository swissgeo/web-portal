<script lang="ts" setup>
import { useClipboard } from "@vueuse/core";

const { copy, copied } = useClipboard();

const { exportState } = useStateConfig();
const { shareLink, embedCode, refresh, needToRefresh } = useCreateShareLink(exportState);
</script>

<template>
  <div class="flex h-auto w-150 flex-col gap-3 px-2 py-5">
    <div>Share Link:</div>
    <UInput
      class="w-full"
      :model-value="shareLink"
      v-if="!needToRefresh"
      readonly
    >
      <template v-if="shareLink?.length" #trailing>
        <UButton
          :color="copied ? 'success' : 'neutral'"
          class="bg-white"
          variant="link"
          size="sm"
          :icon="copied ? 'i-lucide-copy-check' : 'i-lucide-copy'"
          aria-label="Copy to clipboard"
          @click="copy(shareLink)"
        />
      </template>
    </UInput>
    <UButton
      v-else
      variant="subtle"
      icon="i-lucide-refresh-cw"
      aria-label="Refresh share link"
      @click="refresh()"
    >
      Generate share link
    </UButton>
    <div>Embedding:</div>
    <UInput class="w-full" v-model="embedCode">
      <template v-if="embedCode?.length" #trailing>
        <UButton
          :color="copied ? 'success' : 'neutral'"
          class="bg-white"
          variant="link"
          size="sm"
          :icon="copied ? 'i-lucide-copy-check' : 'i-lucide-copy'"
          aria-label="Copy to clipboard"
          @click="copy(embedCode)"
        />
      </template>
    </UInput>
  </div>
</template>
