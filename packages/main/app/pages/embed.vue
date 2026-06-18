<script setup lang="ts">
const route = useRoute();
provideEmbedConfig({
  stateId: route.query.state as string | undefined,
  zoomOnlyCtrl: route.query.zoomOnlyCtrl === "true",
});
</script>

<template>
  <NuxtLayout name="embed">
    <EmbedMapViewer />
  </NuxtLayout>
</template>
