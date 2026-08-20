<script setup lang="ts">
import type {
  ContentItem,
  LeadContentPageWithCheckbox,
  Section,
  TeaserContainer,
} from "@swissgeo/content";

const { containers } = defineProps<{ containers: ContentItem[] }>();

const { t } = useI18n();
const localePath = useLocalePath();
const carousel = useTemplateRef("carousel");
const selectedIndex = ref(0);

const isLead = (item: ContentItem): item is LeadContentPageWithCheckbox => {
  return (
    "component" in item && item.component === "lead-contentpage-with-checkbox"
  );
};

const isSection = (item: ContentItem): item is Section => {
  return "component" in item && item.component === "section";
};

const isTeaserContainer = (item: ContentItem): item is TeaserContainer => {
  return "component" in item && item.component === "teaser-container";
};

const lead = computed(() => containers.find(isLead));
const sectionItems = computed(() => {
  return containers.find(isSection)?.containers.section ?? [];
});
const teaserContainers = computed(() => {
  return sectionItems.value.filter(isTeaserContainer);
});
const carouselContainer = computed(() => {
  return teaserContainers.value.find(
    (container) => container.styles?.pageCardPresentation === "teaser-carousel",
  );
});
const carouselItems = computed(() => {
  return carouselContainer.value?.containers.teaserItems ?? [];
});
const gridContainers = computed(() => {
  return teaserContainers.value.filter(
    (container) => container !== carouselContainer.value,
  );
});

const breadcrumbs = computed(() => [
  {
    label: t("servicesPage.home"),
    to: localePath("/home"),
  },
  {
    label: t("servicesPage.geodataAndMaps"),
  },
  {
    label: t("servicesPage.geoservices"),
  },
]);

const scrollPrevious = () => {
  carousel.value?.emblaApi?.scrollPrev();
};

const scrollNext = () => {
  carousel.value?.emblaApi?.scrollNext();
};
</script>

<template>
  <UBreadcrumb
    :items="breadcrumbs"
    class="mb-16"
    :ui="{
      list: 'gap-1.5',
      link: 'font-editorial text-sm font-medium text-muted',
      separatorIcon: 'size-5 text-muted',
    }"
  />

  <div class="2xl:grid 2xl:grid-cols-12 2xl:gap-x-8">
    <ContentRenderer
      v-if="lead"
      :containers="[lead]"
      class="2xl:col-span-8 2xl:col-start-3"
    />
  </div>

  <section v-if="carouselItems.length" class="mb-16">
    <div class="mb-8 flex items-center justify-between gap-8">
      <h2 class="p-0 text-2xl leading-[1.2] font-medium text-default">
        {{ carouselContainer?.content.teaserTitle }}
      </h2>
      <div class="flex shrink-0 items-center gap-4">
        <span class="text-lg leading-7 font-bold text-default">
          {{ selectedIndex + 1 }}/{{ carouselItems.length }}
        </span>
        <UButton
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="outline"
          size="sm"
          class="rounded-full"
          :disabled="selectedIndex === 0"
          :aria-label="t('servicesPage.previous')"
          @click="scrollPrevious"
        />
        <UButton
          icon="i-lucide-arrow-right"
          color="neutral"
          variant="outline"
          size="sm"
          class="rounded-full"
          :disabled="selectedIndex === carouselItems.length - 1"
          :aria-label="t('servicesPage.next')"
          @click="scrollNext"
        />
      </div>
    </div>
    <UCarousel
      ref="carousel"
      :items="carouselItems"
      align="start"
      :ui="{
        container: 'items-stretch gap-8',
        item: 'basis-full ps-0 sm:basis-[calc(50%-16px)] xl:basis-[calc(33.333%-21.333px)] 2xl:basis-[calc(25%-24px)]',
      }"
      @select="selectedIndex = $event"
    >
      <template #default="{ item }">
        <ContentElementTeaserItem :data="item" />
      </template>
    </UCarousel>
  </section>

  <section v-if="gridContainers.length" class="mb-16">
    <h2 class="mb-8 p-0 text-2xl leading-[1.2] font-medium text-default">
      {{ t("servicesPage.useData") }}
    </h2>
    <div
      class="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
    >
      <template v-for="container in gridContainers" :key="container.id">
        <ContentElementTeaserItem
          v-for="item in container.containers.teaserItems ?? []"
          :key="item.id"
          :data="item"
          :badge="container.content.teaserTitle"
        />
      </template>
    </div>
  </section>
</template>
