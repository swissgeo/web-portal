<script lang="ts" setup>
const { resetApp } = useResetApp();
</script>

<template>
  <div class="flex h-dvh flex-col">
    <Topbar :display-search-bar="false" @reset-app="resetApp" />
    <UMain as="div" class="min-h-0 flex-1">
      <main id="main" ref="main" class="h-full font-sans">
        <div class="relative h-full">
          <div class="relative h-full w-full">
            <slot />
          </div>
        </div>
      </main>
    </UMain>
  </div>
</template>
