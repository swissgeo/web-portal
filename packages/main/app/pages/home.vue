<script setup lang="ts">
import { getCmsDocumentId } from "~/utils/cmsPages";

import LivingdocsPage from "~/pages/page.vue";

const { locale } = useI18n();
const documentId = computed(() => getCmsDocumentId("home", locale.value));
</script>

<template>
  <LivingdocsPage :document-id="documentId" />
</template>
