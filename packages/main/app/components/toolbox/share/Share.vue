<script lang="ts" setup>
import type { TabsItem } from "@nuxt/ui";

import { useClipboard } from "@vueuse/core";
import { useToolboxStore } from "~/stores/toolbox";
import { useI18n } from "vue-i18n";

import ShareEmbed from "./ShareEmbed.vue";
import ShareLink from "./ShareLink.vue";

const { t } = useI18n();
const toolboxStore = useToolboxStore();
const zoomOnlyCtrl = ref(false);

const { copy: copyLink, copied: copiedLink } = useClipboard();
const { copy: copyEmbed, copied: copiedEmbed } = useClipboard();

const { exportState } = useStateConfig();
const { shareLink, embedCode, refresh, needToRefresh } = useCreateShareLink(
  exportState,
  {
    autoRefresh: true,
    zoomOnlyCtrl,
  },
);

const items = [
  {
    label: "Link teilen",
    slot: "link" as const,
  },
  {
    label: "Einbetten",
    slot: "embed" as const,
  },
] satisfies TabsItem[];
</script>

<template>
  <UAlert
    data-testid="toolbox-share-card"
    :title="t('toolbox.share.title')"
    icon="i-lucide-share-2"
    color="neutral"
    variant="outline"
    close
  >
    <template #description>
      <UTabs
        :items="items"
        variant="link"
        class="w-full gap-4"
        :ui="{
          trigger: 'text-xs',
        }"
      >
        <template #link>
          <ShareLink
            :link="shareLink"
            :copied="copiedLink"
            @copy="copyLink(shareLink)"
          />
        </template>

        <template #embed>
          <ShareEmbed
            :embed-code="embedCode"
            :copied="copiedEmbed"
            @copy="copyEmbed(embedCode)"
            v-model:zoom-only-ctrl="zoomOnlyCtrl"
          />
        </template>
      </UTabs>
    </template>
  </UAlert>
</template>
