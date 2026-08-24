<script lang="ts" setup>
import type { FeatureData } from "@swissgeo/feature";

import { sanitizeHtml } from "@/utils/sanitize";
const { t } = useI18n();
const { featureData } = defineProps<{ featureData: FeatureData }>();

const sanitizedHtml = computed(() =>
  featureData.content.kind !== "html"
    ? undefined
    : featureData.content.trusted
      ? featureData.content.html
      : sanitizeHtml(featureData.content.html, t("featureInfo.blockedContent")),
);

const jsonEntries = computed(() =>
  featureData.content.kind === "json"
    ? Object.entries(featureData.content.properties).filter(
        // TODO: question to answer --> falsy values can be valid (an altitude could be 0, for example.)
        // I would remove explicitly nullish attributes, and let the data provider provide data he wants to display
        ([, v]) => v !== null && v !== undefined,
      )
    : [],
);
</script>
<template>
  <!-- single root wrapper so the data-testid anchor survives the v-if branches -->
  <div data-testid="feature-info-content">
    <div v-if="sanitizedHtml" v-html="sanitizedHtml" />
    <div v-else-if="featureData.content.kind === 'json'">
      <div v-for="[key, value] in jsonEntries" :key="key">
        <div
          v-if="key === 'description' && typeof value === 'string'"
          v-html="sanitizeHtml(value, t('featureInfo.blockedContent'))"
        />
        <div v-else>{{ key }} : {{ value }}</div>
      </div>
      <div v-if="jsonEntries.length === 0">
        {{ t("featureInfo.noInformation") }}
      </div>
    </div>
  </div>
</template>

<style lang="css">
/**
  this is the html popup styling from mapviewer
*/
.htmlpopup-container {
  width: 100%;
  font-size: 11px;
  text-align: start;
}
.htmlpopup-header {
  display: none;
}
.htmlpopup-content {
  padding: 7px;
}
/* fix for layer HTML containing table, such as ch.bafu.gefahren-aktuelle_erdbeben*/
.htmlpopup-container .t_list {
  width: 100%;
}
.htmlpopup-container td {
  vertical-align: top;
}
.htmlpopup-container td.cell-left {
  padding-right: 10px;
}
</style>
