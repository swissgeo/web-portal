<script lang="ts" setup>
import type { TabsItem } from "@nuxt/ui";

import { useClipboard } from "@vueuse/core";
import { DEFAULT_RESOLUTION } from "~/composables/useCreateShareLink";
import { useI18n } from "vue-i18n";

import { useToolboxStore } from "@/stores/toolbox";

import ShareEmbed from "./ShareEmbed.vue";
import ShareLink from "./ShareLink.vue";

const { t } = useI18n();
const zoomOnlyCtrl = ref(false);
const fullWidth = ref(false);
const resolution = ref({ ...DEFAULT_RESOLUTION });

const toolboxStore = useToolboxStore();
const toaster = useToaster();

const { copy: copyLink, copied: copiedLink } = useClipboard();
const { copy: copyEmbed, copied: copiedEmbed } = useClipboard();

const { exportState } = useStateConfig();
const drawingEditable = ref(false);
const { shareLink, embedCode, embedUrl, refresh } = useCreateShareLink(
  exportState,
  {
    autoRefresh: true,
    debounce: 500,
    maxWait: 2000,
    drawingEditable,
    onError: () => toaster.showError(t("state.shareLinkError")),
    zoomOnlyCtrl,
    fullWidth,
    resolution,
  },
);

watch(drawingEditable, () => {
  void refresh();
});

const items = computed<TabsItem[]>(() => [
  {
    label: t("toolbox.share.link.tabLabel"),
    slot: "link" as const,
  },
  {
    label: t("toolbox.share.embed.tabLabel"),
    slot: "embed" as const,
  },
]);
</script>

<template>
  <UAlert
    data-testid="toolbox-share-card"
    :title="t('toolbox.share.title')"
    icon="i-lucide-share-2"
    color="neutral"
    variant="outline"
    close
    @update:open="toolboxStore.closeDetailPanel()"
  >
    <template #description>
      <UTabs
        :items="items"
        variant="link"
        class="w-full gap-4"
        :ui="{
          trigger: 'text-sm',
        }"
      >
        <template #link>
          <ShareLink
            :link="shareLink"
            :copied="copiedLink"
            v-model:drawing-editable="drawingEditable"
            @copy="copyLink(shareLink)"
          />
        </template>

        <template #embed>
          <ShareEmbed
            :embed-code="embedCode"
            :copied="copiedEmbed"
            :embed-url="embedUrl"
            @copy="copyEmbed(embedCode)"
            v-model:zoom-only-ctrl="zoomOnlyCtrl"
            v-model:full-width="fullWidth"
            v-model:resolution="resolution"
          />
        </template>
      </UTabs>
    </template>
  </UAlert>
</template>
