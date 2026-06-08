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
    :avatar="{
      src: '',
      alt: contact.organization,
    }"
    size="xl"
  />
</template>
