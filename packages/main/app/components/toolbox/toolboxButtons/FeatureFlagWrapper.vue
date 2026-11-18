<script setup lang="ts">
import { createReusableTemplate } from "@vueuse/core";
import { ref, useId } from "vue";
import { useI18n } from "vue-i18n";

defineProps<{
  featureFlagEnabled: boolean;
}>();

const { t } = useI18n();
const { cmsUrl } = useCmsUrl();

const isDesktop = useIsDesktop();

const descriptionId = useId();
const popoverOpen = ref(false);

const [RegisterTemplate, ReuseTemplate] = createReusableTemplate();
</script>

<template>
  <RegisterTemplate>
    <slot :is-disabled="!featureFlagEnabled" />
  </RegisterTemplate>

  <template v-if="!featureFlagEnabled">
    <UPopover
      v-model:open="popoverOpen"
      :mode="isDesktop ? 'hover' : 'click'"
      enable-touch
      :content="{ side: isDesktop ? 'left' : 'top', sideOffset: 12 }"
      :portal="isDesktop"
    >
      <!-- On a phone, a tap opens the message:
           - a disabled button swallows the tap, so the wrapper takes it
           - focus would open it before the click toggles it, so only the
             click counts
           - the popover stays inside the tools drawer, which would close
             when the focus leaves it -->
      <div
        :class="{ '*:pointer-events-none': !isDesktop }"
        data-testid="feature-flag-trigger"
        tabindex="0"
        :aria-describedby="descriptionId"
        @focus="isDesktop && (popoverOpen = true)"
        @blur="isDesktop && (popoverOpen = false)"
      >
        <ReuseTemplate />
      </div>

      <template #content>
        <div class="max-w-36 px-2 py-1 text-xs font-medium text-highlighted">
          <p>{{ t("toolbox.featureFlag.notAvailable") }}</p>
          <UButton
            :to="cmsUrl(t('toolbox.featureFlag.links.roadmap'))"
            variant="link"
            size="xs"
            target="_blank"
            class="mt-2"
            :ui="{
              base: 'p-0',
            }"
          >
            {{ t("toolbox.featureFlag.workingOnIt") }}
          </UButton>
        </div>
      </template>
    </UPopover>

    <span :id="descriptionId" class="sr-only">
      {{ t("toolbox.featureFlag.notAvailable") }}
      {{ t("toolbox.featureFlag.workingOnIt") }}
    </span>
  </template>
  <template v-else>
    <ReuseTemplate />
  </template>
</template>

<style scoped></style>
