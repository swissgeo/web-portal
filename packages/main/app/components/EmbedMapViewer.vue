<script lang="ts" setup>
import { LogoPic } from "@swissgeo/skeleton";

const url = useRequestURL();
const { t } = useI18n();

const { attributionSources, displayMode } = useMapViewerSetup();
const { stateId } = useEmbedConfig();
</script>

<template>
  <BaseMapViewer :display-mode="displayMode">
    <template v-if="stateId" #before>
      <UButton
        class="fixed top-4 left-4 z-9999"
        :to="`${url.origin}/map?state=${stateId}`"
        target="_blank"
        variant="solid"
        data-testid="embed-map-viewer-view-on-swissgeo-button"
      >
        <LogoPic class="h-auto w-auto!" :condensed="true" />
        {{ t("embed.viewOn", { platform: "swissgeo.ch" }) }}
      </UButton>
    </template>
    <template #map-ui>
      <MapAttributionList :sources="attributionSources" />
    </template>
  </BaseMapViewer>
</template>
