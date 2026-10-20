<script lang="ts" setup>
import type { Contact } from "@swissgeo/ogc";

import { computed } from "vue";

const { contact } = defineProps<{
  contact: Contact;
}>();

interface ContactRow {
  icon: string;
  href: string;
  label: string;
}

const rows = computed((): ContactRow[] => {
  // Skip fax numbers.
  const phone = contact.phones?.find(({ roles }) => !roles?.includes("fax"));
  const email = contact.emails?.[0]?.value;
  const website = contact.links?.[0]?.href;
  return [
    phone && {
      icon: "i-lucide-phone",
      href: `tel:${phone.value.replace(/\s/g, "")}`,
      label: phone.value,
    },
    email && {
      icon: "i-lucide-mail",
      href: `mailto:${email}`,
      label: email,
    },
    website && {
      icon: "i-lucide-globe",
      href: website,
      label: website.replace(/^https?:\/\/(www\.)?/, ""),
    },
  ].filter((row): row is ContactRow => !!row);
});
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
  >
    <template v-if="rows.length" #description>
      <ULink
        v-for="row in rows"
        :key="row.href"
        :to="row.href"
        target="_blank"
        class="mt-space-2xs flex items-center gap-space-xs text-sm text-primary"
      >
        <UIcon :name="row.icon" class="size-4 shrink-0" />{{ row.label }}
      </ULink>
    </template>
  </UUser>
</template>
