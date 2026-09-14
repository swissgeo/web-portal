<script setup lang="ts">
definePageMeta({ layout: "embed" });

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
  <EmbedMapViewer :state-id="stateId" :zoom-only-ctrl="zoomOnlyCtrl" />
</template>
