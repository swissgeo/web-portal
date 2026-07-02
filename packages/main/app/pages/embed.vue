<script setup lang="ts">
const route = useRoute();
const stateId = useState(
  "embedStateId",
  () => route.query.state as string | undefined,
).value;
const zoomOnlyCtrl = useState(
  "embedZoomOnlyCtrl",
  () => route.query.zoomOnlyCtrl === "true",
).value;
</script>

<template>
  <NuxtLayout name="embed">
    <EmbedMapViewer :state-id="stateId" :zoom-only-ctrl="zoomOnlyCtrl" />
  </NuxtLayout>
</template>
