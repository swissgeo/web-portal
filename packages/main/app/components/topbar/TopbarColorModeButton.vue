<script setup lang="ts">
const { t } = useI18n();
</script>

<template>
  <UColorModeButton
    :label="t('topbar.modeSwitch')"
    color="primary"
    variant="ghost"
    size="md"
  />
</template>
