<script setup lang="ts">
// Phones currently render the desktop UI in a desktop sized layout viewport
// (see the viewport meta in nuxt.config.ts). This tells them on every page
// load that a proper mobile UI is coming.
//
// The layout viewport is always desktop wide, so we cannot rely on media
// queries to detect phones. `screen` reports the physical screen size in CSS
// pixels regardless of the viewport meta.
const MOBILE_SCREEN_MAX_WIDTH = 768;

const open = ref(false);

onMounted(() => {
  open.value =
    Math.min(window.screen.width, window.screen.height) <
    MOBILE_SCREEN_MAX_WIDTH;
});
</script>

<template>
  <!-- Sized in vw because the page is scaled down to fit the phone screen,
       which would make regular text sizes unreadable. -->
  <UModal
    v-model:open="open"
    :title="$t('mobileNotice.title')"
    :description="$t('mobileNotice.description')"
    :close="false"
    :ui="{
      content: 'max-w-[90vw] w-[90vw] rounded-[2vw]',
      header: 'p-[5vw] sm:p-[5vw]',
      title: 'text-[5.5vw]',
      description: 'mt-[2vw] text-[4vw]',
      footer: 'justify-end p-[5vw] sm:p-[5vw]',
    }"
    data-testid="mobile-notice"
  >
    <template #footer>
      <UButton
        :label="$t('mobileNotice.confirm')"
        class="rounded-[1.5vw] px-[6vw] py-[2.5vw] text-[4vw]"
        data-testid="mobile-notice-confirm"
        @click="open = false"
      />
    </template>
  </UModal>
</template>
