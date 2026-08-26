<script setup lang="ts">
import type { TeaserContainer } from "@content/types";

import { computed, ref } from "vue";

const { data } = defineProps<{ data: TeaserContainer }>();

const teaserItems = computed(() => data.containers?.teaserItems ?? []);
const isCarousel = computed(
  () => data.styles?.pageCardPresentation === "teaser-carousel",
);
const selectedIndex = ref(0);
</script>

<template>
  <section v-if="teaserItems.length" class="relative mb-16">
    <div class="mb-8 flex items-center justify-between gap-8">
      <h2
        v-if="data.content?.teaserTitle"
        class="p-0 font-editorial text-2xl leading-[1.2] font-medium text-highlighted"
      >
        {{ data.content.teaserTitle }}
      </h2>
      <span
        v-if="isCarousel"
        class="mr-24 shrink-0 text-lg leading-7 font-bold text-default"
      >
        {{ selectedIndex + 1 }}/{{ teaserItems.length }}
      </span>
    </div>

    <UCarousel
      v-if="isCarousel"
      :items="teaserItems"
      align="start"
      arrows
      :prev="{ size: 'sm' }"
      :next="{ size: 'sm' }"
      :ui="{
        controls: 'absolute -top-16 right-0',
        arrows: 'gap-4',
        prev: 'rounded-full',
        next: 'rounded-full',
        container: 'items-stretch gap-8',
        item: 'basis-full ps-0 tablet:basis-[calc(50%-16px)] desktop:basis-[calc(33.333%-21.333px)] 2xl:basis-[calc(25%-24px)]',
      }"
      @select="selectedIndex = $event"
    >
      <template #default="{ item }">
        <ContentElementTeaserItem :data="item" />
      </template>
    </UCarousel>

    <div
      v-else
      class="grid grid-cols-1 gap-8 tablet:grid-cols-2 desktop:grid-cols-3 2xl:grid-cols-4"
    >
      <ContentElementTeaserItem
        v-for="item in teaserItems"
        :key="item.id"
        :data="item"
      />
    </div>
  </section>
</template>
