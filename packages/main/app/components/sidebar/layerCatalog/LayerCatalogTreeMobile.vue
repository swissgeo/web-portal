<script lang="ts" setup>
import type { AsyncDataRequestStatus } from "#app";
import type { ThesaurusConcept } from "~/types/thesaurus";

import { useI18n } from "vue-i18n";

import LayerCatalogLoadingStatus from "./LayerCatalogLoadingStatus.vue";
import useConceptPath from "./useConceptPath";

const { t } = useI18n();

/** `null` selects the root, which stands for all layers */
const conceptId = defineModel<string | null>("conceptId", { required: true });

const emit = defineEmits<{
  /** The selection is done, or the close button was used */
  close: [];
}>();

const { concepts, status } = defineProps<{
  concepts: ThesaurusConcept[] | undefined;
  /** Loading status of the concepts */
  status: AsyncDataRequestStatus;
}>();

const path = useConceptPath(
  () => concepts,
  () => status,
  conceptId,
);

/**
 * Path down to the folder that is shown: the selected entry when it has
 * children or is the root, its parent otherwise.
 */
const folderPath = computed(() => {
  const selected = path.value.at(-1);
  const isLeafSelected = path.value.length > 1 && !selected?.children.length;
  return isLeafSelected ? path.value.slice(0, -1) : path.value;
});
const folder = computed(() => folderPath.value.at(-1));

function goBack() {
  conceptId.value = folderPath.value.at(-2)?.id ?? null;
}

function selectFolder() {
  conceptId.value = folder.value?.id ?? null;
  emit("close");
}

function selectChild(child: ThesaurusConcept) {
  conceptId.value = child.id;
  // A child with children becomes the folder that is shown
  if (!child.children.length) {
    emit("close");
  }
}

const entryClass =
  "cursor-pointer justify-start px-2 py-1 text-start leading-small-text";
const selectedEntryClass = "bg-elevated text-accent-active";
</script>

<template>
  <div class="flex flex-col gap-0.5 px-4 pt-1 pb-4">
    <div class="flex items-start gap-1.5 px-2 pt-1 pb-2">
      <p
        class="min-w-0 flex-1 truncate text-sm leading-small-text font-bold text-highlighted"
      >
        {{ t("layerCatalog.layers") }}
      </p>
      <UButton
        icon="i-lucide-x"
        :aria-label="t('layerCatalog.close')"
        color="accent"
        variant="link"
        class="cursor-pointer p-0"
        @click="emit('close')"
      />
    </div>
    <div class="px-2">
      <LayerCatalogLoadingStatus :status>
        <div v-if="folder" class="-mx-2 flex flex-col gap-0.5">
          <UButton
            v-if="folderPath.length > 1"
            color="accent"
            variant="ghost"
            block
            icon="i-lucide-chevron-left"
            :class="[entryClass, 'pl-1']"
            @click="goBack"
          >
            {{ t("layerCatalog.back") }}
          </UButton>
          <div class="py-2">
            <UButton
              color="accent"
              variant="ghost"
              block
              :class="[
                entryClass,
                'font-bold',
                folder.id === conceptId && selectedEntryClass,
              ]"
              @click="selectFolder"
            >
              {{ folder.label }}
            </UButton>
          </div>
          <UButton
            v-for="child in folder.children"
            :key="child.id"
            color="accent"
            variant="ghost"
            block
            :trailing-icon="
              child.children.length ? 'i-lucide-chevron-right' : undefined
            "
            :class="[entryClass, child.id === conceptId && selectedEntryClass]"
            @click="selectChild(child)"
          >
            {{ child.label }}
          </UButton>
        </div>
      </LayerCatalogLoadingStatus>
    </div>
  </div>
</template>
