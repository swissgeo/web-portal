<script lang="ts" setup>
import type { Contact } from '@swissgeo/ogc'

defineProps<{
    contact: Contact
}>()
</script>

<template>
    <div class="flex flex-col gap-1 text-sm">
        <span class="font-medium text-neutral-800">{{ contact.organisation }}</span>
        <span class="text-neutral-500">{{ contact.role }}</span>
        <span class="text-neutral-500">{{ contact.country }}</span>
    </div>
</template>
