<script lang="ts" setup>
import { displayModeKey } from "~/types/injectionKeys";
const toaster = { position: "top-center" as const };
provide(displayModeKey, "web");
</script>

<template>
  <UApp :toaster="toaster">
    <NuxtPage
      :page-key="(route) => route.path.replace(/^\/(de|fr|en|it|rm)/, '')"
    />
  </UApp>
</template>
