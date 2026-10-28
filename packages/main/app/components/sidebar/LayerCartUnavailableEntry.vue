<script lang="ts" setup>
import ErrorPill from "~/components/ErrorPill.vue";
import { useI18n } from "vue-i18n";

const { uuid, displayName } = defineProps<{
  uuid: string;
  displayName: string;
}>();

const { t } = useI18n();
const mapViewStore = useMapViewStore();
</script>

<template>
  <!-- A layer that could not load. Only "remove" stays active. -->
  <li data-testid="layer-cart-unavailable" class="flex min-w-0 items-start">
    <div class="min-w-0 flex-1 px-1 pl-15">
      <p class="truncate text-dimmed" :title="displayName">
        {{ displayName }}
      </p>
      <ErrorPill>{{ t("layers.unavailable") }}</ErrorPill>
    </div>
    <div class="flex shrink-0 items-center">
      <UButton
        icon="i-lucide-eye-off"
        size="xs"
        color="neutral"
        variant="ghost"
        disabled
        :title="t('layers.show')"
      />
      <UButton
        icon="i-lucide-info"
        size="xs"
        color="neutral"
        variant="ghost"
        disabled
        :title="t('layers.info')"
      />
      <UButton
        icon="i-lucide-trash-2"
        size="xs"
        color="primary"
        variant="ghost"
        :title="t('layers.remove')"
        @click="mapViewStore.removeUnavailableLayer(uuid)"
      />
    </div>
  </li>
</template>
