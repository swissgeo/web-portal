<script setup lang="ts">
const route = useRoute();
const stateQuery = route.query.state as string | undefined;
</script>

<template>
  <NuxtLayout name="embedded">
    <EmbeddedMapViewer :state-query="stateQuery" />
  </NuxtLayout>
</template>
