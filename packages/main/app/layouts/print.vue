<!-- eslint multi-word: off-->
<script lang="ts" setup>

</script>

<template>
    <main
        ref="main"
        class="font-sans fitting-content"
    >
        <slot />
    </main>
</template>

<style lang="css" scoped>
.fitting-content {
    width: fit-content;
    height: fit-content;
}
</style>