<script lang="ts" setup>
import type { Link } from '@swissgeo/ogc'

defineProps<{
    links: Link[]
}>()
</script>

<template>
    <ul class="flex flex-col gap-2">
        <li
            v-for="link in links"
            :key="link.href"
        >
            <ULink
                :to="link.href"
                target="_blank"
                raw
                class="flex items-center gap-1"
            >
                <UIcon
                    name="i-lucide-external-link"
                    class="size-3 shrink-0"
                />
                {{ link.title ?? link.href }}
            </ULink>
        </li>
    </ul>
</template>
