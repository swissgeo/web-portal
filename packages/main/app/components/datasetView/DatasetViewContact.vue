<script lang="ts" setup>
import type { Contact } from '@swissgeo/ogc'

defineProps<{
    contact: Contact
}>()
</script>

<template>
    <UUser
        :name="contact.organisation"
        :description="`${contact.role} (${contact.country})`"
        :avatar="{
            src: '',
            alt: contact.organisation,
        }"
        size="xl"
    />
</template>
