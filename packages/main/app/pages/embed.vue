<script setup lang="ts">
const route = useRoute();
const stateId = route.query.state as string | undefined;
</script>

<template>
  <NuxtLayout name="embed">
    <EmbedMapViewer :state-id="stateId" />
  </NuxtLayout>
</template>
