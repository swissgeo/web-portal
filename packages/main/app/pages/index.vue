<script lang="ts" setup>
const localePath = useLocalePath()
</script>

<template>
    <div class="block">Home. <NuxtLink :to="localePath('/map')">Go to map</NuxtLink></div>
</template>
