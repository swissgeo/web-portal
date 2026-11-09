<template>
  <div class="flex h-dvh flex-col">
    <TestSiteBanner />
    <Topbar :display-search-bar="false" />
    <UMain as="div" class="min-h-0 flex-1">
      <main id="main" ref="main" class="h-full font-sans">
        <div class="h-full w-full">
          <slot />
        </div>
        <ClientOnly>
          <MobileNotice />
        </ClientOnly>
      </main>
    </UMain>
  </div>
</template>
