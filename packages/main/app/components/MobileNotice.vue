<script setup lang="ts">
// TODO GPS-1187: remove once the mobile UI is stable.
import log from "@swissgeo/log";
import { breakpointsTailwind } from "@vueuse/core";

// Same cut as useIsDesktop.
const MOBILE_SCREEN_MAX_WIDTH = breakpointsTailwind.md;
const DISMISSED_STORAGE_KEY = "swissgeo_mobile_notice_dismissed";

// App-wide, so the dismiss survives the layout change.
const isDismissed = useState("mobile-notice-dismissed", () => false);
const open = ref(false);

function isDismissStored(): boolean {
  try {
    return sessionStorage.getItem(DISMISSED_STORAGE_KEY) === "true";
  } catch (error) {
    log.warn({
      title: "MobileNotice",
      messages: [
        "Failed to read the dismiss from sessionStorage",
        String(error),
      ],
    });
    return false;
  }
}

function dismiss() {
  isDismissed.value = true;
  try {
    sessionStorage.setItem(DISMISSED_STORAGE_KEY, "true");
  } catch (error) {
    log.warn({
      title: "MobileNotice",
      messages: [
        "Failed to store the dismiss in sessionStorage",
        String(error),
      ],
    });
  }
}

// Focus the dialog, not the close button: its focus ring shows on page load.
function focusDialog(event: Event) {
  event.preventDefault();
  (event.target as HTMLElement).focus();
}

function onOpenChange(value: boolean) {
  open.value = value;
  if (!value) {
    dismiss();
  }
}

onMounted(() => {
  const { width, height } = window.screen;
  // Scaled down by the desktop viewport. Browser zoom does not change it.
  const isScaledDown = (window.visualViewport?.scale ?? 1) < 1;
  const isSmallScreen = Math.min(width, height) < MOBILE_SCREEN_MAX_WIDTH;
  open.value =
    isScaledDown && isSmallScreen && !isDismissed.value && !isDismissStored();
});
</script>

<template>
  <!-- vmin: readable on the scaled page, same size in portrait and landscape. -->
  <UModal
    :open="open"
    :title="$t('mobileNotice.title')"
    :description="$t('mobileNotice.description')"
    :close="{ ui: { leadingIcon: 'size-[6vmin]' } }"
    scrollable
    :content="{ onOpenAutoFocus: focusDialog }"
    :ui="{
      content: 'w-[90vmin] max-w-none rounded-[2vmin]',
      header: 'min-h-0 p-[5vmin] pe-[14vmin] sm:p-[5vmin] sm:pe-[14vmin]',
      title: 'text-[5.5vmin]',
      description: 'mt-[2vmin] text-[4vmin]',
      close: 'top-[4vmin] end-[4vmin] p-[2vmin]',
      footer: 'justify-end p-[5vmin] sm:p-[5vmin]',
    }"
    @update:open="onOpenChange"
  >
    <template #footer>
      <UButton
        :label="$t('mobileNotice.confirm')"
        class="rounded-[1.5vmin] px-[6vmin] py-[2.5vmin] text-[4vmin]"
        data-testid="mobile-notice-confirm"
        @click="onOpenChange(false)"
      />
    </template>
  </UModal>
</template>
