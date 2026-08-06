<script lang="ts" setup>
import type { Lang } from "@swissgeo/shared/language";

import log, { LogPreDefinedColor } from "@swissgeo/log";
import { computed, ref, watch } from "vue";

const { locale, locales } = useI18n();
const appStore = useAppStore();

const localeItems = computed(() => {
  return locales.value.map((item) => ({
    code: item.code,
    name: item.name ?? item.code,
    dir: (item.dir ?? "ltr") as "ltr" | "rtl",
    messages: {},
  }));
});

const selectedLocale = ref<Lang>(locale.value);

watch(locale, (value) => {
  selectedLocale.value = value;
});

watch(selectedLocale, async (value) => {
  if (value && value !== locale.value) {
    try {
      await appStore.applyLocale(value);
    } catch (err) {
      log.error({
        title: "TopbarLanguageSwitcherButton",
        titleColor: LogPreDefinedColor.Rose,
        messages: [
          `Error while switching the language from ${locale.value} to ${value}`,
          err,
        ],
      });
    }
  }
});
</script>

<template>
  <ClientOnly>
    <USelectMenu
      v-model="selectedLocale"
      :items="localeItems"
      value-key="code"
      label-key="code"
      size="md"
      variant="outline"
      :trailing="false"
      :searchInput="false"
      aria-label="Language switcher"
      :ui="{
        content: '!w-auto min-w-[150px] !max-w-none',
        value: 'uppercase',
      }"
    >
      <template #item-label="{ item }">
        {{ item.name }}
      </template>
    </USelectMenu>
  </ClientOnly>
</template>
