<script setup lang="ts">
const { t } = useI18n();
</script>

<template>
  <UColorModeButton
    :label="t('topbar.modeSwitch')"
    color="neutral"
    variant="ghost"
    size="sm"
    class="text-primary hover:bg-primary/10 hover:text-primary"
  />
</template>
