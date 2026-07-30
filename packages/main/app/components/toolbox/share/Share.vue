<script lang="ts" setup>
import { useClipboard } from "@vueuse/core";
import { useToolboxStore } from "~/stores/toolbox";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const toolboxStore = useToolboxStore();
const zoomOnlyCtrl = ref(false);

const { copy: copyLink, copied: copiedLink } = useClipboard();
const { copy: copyEmbed, copied: copiedEmbed } = useClipboard();

const { exportState } = useStateConfig();
const { shareLink, embedCode, refresh, needToRefresh } = useCreateShareLink(
  exportState,
  {
    zoomOnlyCtrl,
  },
);
</script>

<template>
  <UCard
    data-testid="toolbox-share-card"
    :ui="{ body: 'flex h-auto w-full flex-col gap-3 px-2 py-5' }"
  >
    <template #header>
      <div class="flex items-start justify-between">
        <div>
          <div class="font-semibold text-highlighted">
            {{ t("toolbox.share.title") }}
          </div>
        </div>
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-x"
          size="sm"
          :aria-label="t('toolbox.share.ariaLabel.close')"
          @click="toolboxStore.closeDetailPanel()"
        />
      </div>
    </template>
    <div>{{ t("toolbox.share.link.title") }}</div>
    <UInput
      class="w-full"
      :model-value="shareLink"
      v-if="!needToRefresh"
      readonly
    >
      <template v-if="shareLink?.length" #trailing>
        <UButton
          :color="copiedLink ? 'success' : 'neutral'"
          class="bg-white"
          variant="link"
          size="sm"
          :icon="copiedLink ? 'i-lucide-copy-check' : 'i-lucide-copy'"
          :aria-label="t('toolbox.share.ariaLabel.copyToClipboard')"
          @click="copyLink(shareLink)"
        />
      </template>
    </UInput>
    <UButton
      v-else
      variant="subtle"
      icon="i-lucide-refresh-cw"
      :aria-label="t('toolbox.share.ariaLabel.refreshLink')"
      @click="refresh()"
    >
      {{ t("toolbox.share.link.generateButton") }}
    </UButton>
    <div>{{ t("toolbox.share.embed.title") }}</div>
    <UCheckbox
      v-model="zoomOnlyCtrl"
      :label="t('toolbox.share.embed.zoomOnlyCtrlLabel')"
    />
    <UInput class="w-full" v-model="embedCode" readonly v-if="!needToRefresh">
      <template v-if="embedCode?.length" #trailing>
        <UButton
          :color="copiedEmbed ? 'success' : 'neutral'"
          class="bg-white"
          variant="link"
          size="sm"
          :icon="copiedEmbed ? 'i-lucide-copy-check' : 'i-lucide-copy'"
          :aria-label="t('toolbox.share.ariaLabel.copyToClipboard')"
          @click="copyEmbed(embedCode)"
        />
      </template>
    </UInput>
    <UButton
      v-else
      variant="subtle"
      icon="i-lucide-refresh-cw"
      :aria-label="t('toolbox.share.ariaLabel.refreshEmbed')"
      @click="refresh()"
    >
      {{ t("toolbox.share.embed.generateButton") }}
    </UButton>
  </UCard>
</template>
