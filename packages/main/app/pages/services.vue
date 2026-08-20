<script setup lang="ts">
import LivingdocsPage from "~/pages/page.vue";
import { getCmsDocumentId } from "~/utils/cmsPages";

definePageMeta({
  headerVariant: "dark",
});

const { locale } = useI18n();
const documentId = computed(() => getCmsDocumentId("services", locale.value));
</script>

<template>
  <LivingdocsPage :document-id="documentId" />
</template>
