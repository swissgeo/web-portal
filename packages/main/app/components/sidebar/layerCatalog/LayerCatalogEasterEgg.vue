<script lang="ts" setup>
import type { Lang } from "@swissgeo/shared";

import { useI18n } from "vue-i18n";

// Easter egg: double-click/tap on the empty state of the oceans concept
const SEASIDE_URLS: Record<Exclude<Lang, "rm">, string> = {
  de: "https://www.myswitzerland.com/de-ch/erlebnisse/sommer-herbst/listicles-summer/a-seaside-feel-by-the-lake/",
  en: "https://www.myswitzerland.com/en-ch/experiences/summer-autumn/listicles/beach-feeling-at-the-lake/",
  fr: "https://www.myswitzerland.com/fr-ch/decouvrir/ete-automne/listicles-dete/une-ambiance-balneaire-au-bord-du-lac/",
  it: "https://www.myswitzerland.com/it-ch/scoprire-la-svizzera/estate-autunno/listicles/a-seaside-feel-by-the-lake/",
};

const { locale } = useI18n();

const { conceptIds } = defineProps<{
  conceptIds: string[];
}>();

const isOceans = computed(
  () => conceptIds.length === 1 && conceptIds[0] === "oceans",
);

// There is no Romansh version, so use the German one
const url = computed(
  () => SEASIDE_URLS[locale.value === "rm" ? "de" : locale.value],
);

function onClick(event: MouseEvent) {
  // Pointer clicks only follow the link on a double-click or a Ctrl/Cmd-click.
  // Keyboard and assistive technology activation (detail 0) follows it right
  // away.
  const isModified = event.ctrlKey || event.metaKey;
  if (event.detail !== 0 && event.detail !== 2 && !isModified) {
    event.preventDefault();
  }
}
</script>

<template>
  <div>
    <a
      v-if="isOceans"
      :href="url"
      target="_blank"
      rel="noopener"
      class="cursor-text touch-manipulation select-none"
      @click="onClick"
    >
      <slot />
      <span class="sr-only">🥚</span>
    </a>
    <slot v-else />
  </div>
</template>
