<script setup lang="ts">
const { t } = useI18n();
</script>

<template>
  <ClientOnly>
    <UColorModeButton
      :label="t('topbar.modeSwitch', 'Mode switch')"
      color="primary"
      variant="ghost"
      size="md"
    />
  </ClientOnly>
</template>
