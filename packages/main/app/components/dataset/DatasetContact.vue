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

// Figma: an outline button on phones, a plain row like email and website on desktop.
const PHONE_BUTTON = {
  color: "primary",
  variant: "outline",
  class: "my-space-2xs",
} as const;
const DESKTOP_ROW = {
  color: "neutral",
  variant: "link",
  class: "mt-space-2xs p-0 text-sm text-default",
  ui: { leadingIcon: "size-4" },
} as const;

const isDesktop = useIsDesktop();
const phoneLink = computed(() =>
  isDesktop.value ? DESKTOP_ROW : PHONE_BUTTON,
);

// Skip fax numbers.
const phone = computed(() =>
  contact.phones?.find(({ roles }) => !roles?.includes("fax")),
);

const rows = computed((): ContactRow[] => {
  const email = contact.emails?.[0]?.value;
  const website = contact.links?.[0]?.href;
  return [
    email && {
      icon: "i-lucide-mail",
      href: `mailto:${email}`,
      label: email,
    },
    website && {
      icon: "i-lucide-globe",
      href: website,
      label: website.replace(/^https?:\/\/(www\.)?|\/$/g, ""),
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
      name: 'font-bold text-default leading-small-text',
      description: 'leading-small-text',
    }"
  >
    <template v-if="phone || rows.length" #description>
      <UButton
        v-if="phone"
        :to="`tel:${phone.value.replace(/\s/g, '')}`"
        icon="i-lucide-phone"
        v-bind="phoneLink"
      >
        {{ phone.value }}
      </UButton>
      <ULink
        v-for="row in rows"
        :key="row.href"
        :to="row.href"
        target="_blank"
        class="mt-space-2xs flex items-center gap-space-xs text-sm leading-small-text font-medium text-primary"
      >
        <UIcon :name="row.icon" class="size-4 shrink-0" />{{ row.label }}
      </ULink>
    </template>
  </UUser>
</template>
