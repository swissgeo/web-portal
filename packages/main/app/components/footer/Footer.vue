<script setup lang="ts"></script>

<template>
  <div
    class="text-accent absolute bottom-0 left-0 flex w-full items-center justify-center bg-muted p-1 text-xs md:text-sm xl:justify-between"
  >
    <ClientOnly>
      <FooterMapInfos />
    </ClientOnly>
    <FooterLinks class="hidden xl:flex" />
  </div>
</template>

<style scoped></style>
