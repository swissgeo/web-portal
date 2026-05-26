<script lang="ts" setup>
import { useClipboard } from "@vueuse/core";

const { copy, copied } = useClipboard();

const { exportState } = useStateConfig();
const { shareLink } = useCreateShareLink(exportState);
</script>

<template>
  <div class="flex h-32 w-150 flex-col gap-3 px-2 py-5">
    <div>Share Link:</div>
    <UInput class="w-full" v-model="shareLink">
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
  </div>
</template>
