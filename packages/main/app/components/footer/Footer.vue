<script setup lang="ts"></script>

<template>
  <div
    class="text-accent absolute bottom-0 left-0 flex w-full flex-row items-center justify-between bg-muted p-1 text-xs"
  >
    <ClientOnly>
      <FooterMapInfos />
    </ClientOnly>
    <FooterLinks />
  </div>
</template>

<style scoped></style>
