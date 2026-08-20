<script setup lang="ts">
import type { ContentItem } from "@swissgeo/content";

import LivingdocsPage from "~/pages/page.vue";
import { getCmsDocumentId } from "~/utils/cmsPages";

definePageMeta({
  headerVariant: "dark",
});

const { locale } = useI18n();
const documentId = computed(() => getCmsDocumentId("services", locale.value));
</script>

<template>
  <LivingdocsPage :document-id="documentId" content-class="py-8">
    <template #content="{ containers }">
      <ServicesPageContent :containers="containers as ContentItem[]" />
    </template>
  </LivingdocsPage>
</template>
