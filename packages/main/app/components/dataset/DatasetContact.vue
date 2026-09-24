<script lang="ts" setup>
import type { Contact } from "@swissgeo/ogc";

const { contact } = defineProps<{
  contact: Contact;
}>();
</script>

<template>
  <UUser
    :name="contact.organization"
    :description="contact.country || undefined"
    size="md"
    class="wrap-anywhere"
    :ui="{
      name: 'font-semibold',
      description: 'leading-small-text',
    }"
  />
</template>
