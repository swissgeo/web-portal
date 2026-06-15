<script setup lang="ts">
import ToolBoxButton from "@/components/toolbox/toolboxButtons/ToolBoxButton.vue";
const webGlIsSupported = ref(false);

onMounted(() => {
  checkWebGlSupport();
});

function checkWebGlSupport(): void {
  const canvas = document.createElement("canvas");
  const gl =
    canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  webGlIsSupported.value = gl instanceof WebGLRenderingContext;
}

function isDisabled(): boolean {
  return webGlIsSupported.value;
}

function isActive(): boolean {
  return false;
}

function toggle3d() {
  throw new Error("3D BUTTON IS NOT IMPLEMENTED AT THE MOMENT");
}
</script>

<template>
  <ToolBoxButton
    title="3D toggle button"
    :is-disabled="isDisabled()"
    :is-active="isActive()"
    iconName="Box"
    @click="toggle3d()"
  />
</template>

<style scoped></style>
