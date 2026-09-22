<script lang="ts" setup>
import type { Contact } from "@swissgeo/ogc";

const { contact } = defineProps<{
  contact: Contact;
}>();

const description = computed(() => {
  const parts = [contact.role, contact.country ? `(${contact.country})` : ""]
    .filter(Boolean)
    .join(" ");
  return parts || undefined;
});
</script>

<template>
  <UUser
    :name="contact.organization"
    :description="description"
    size="xl"
    class="rounded-lg border border-default bg-default p-space-m wrap-anywhere"
    :ui="{
      name: 'font-semibold',
      description: 'mt-space-xs leading-small-text',
    }"
  />
</template>
