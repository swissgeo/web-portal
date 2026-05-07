<script lang="ts" setup>
const toaster = { position: 'top-center' as const }
provide<'web' | 'print'>('displayMode', 'web')
</script>

<template>
    <UApp :toaster="toaster">
        <NuxtPage :page-key="(route) => route.path.replace(/^\/(de|fr|en|it|rm)/, '')" />
    </UApp>
</template>
