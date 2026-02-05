<script setup lang="ts">
import { LucideIcon } from '@swissgeo/skeleton'
const webGlIsSupported = ref(false)

onMounted(() => {
    checkWebGlSupport()
})

function checkWebGlSupport(): void {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    webGlIsSupported.value = gl instanceof WebGLRenderingContext
}

function isDisabled(): boolean {
    return webGlIsSupported.value
}

function toggle3d() {
    throw new Error('3D BUTTON IS NOT IMPLEMENTED AT THE MOMENT')
}
</script>

<template>
    <button
        ref="toggle3DButton"
        class="toolbox-button h-[40px] w-[40px] rounded-[20px] bg-gray-500 text-white"
        type="button"
        :class="{
            disabled: !webGlIsSupported,
        }"
        :disabled="isDisabled()"
        data-cy="3d-button"
        @click="toggle3d"
    >
        <LucideIcon
            name="Box"
            class="h-[40px] w-[40px]"
        />
    </button>
</template>

<style scoped></style>
