<script setup lang="ts">
import type { CoordinateSystem } from '@swissgeo/coordinates'
import type { Row } from '~/composables/useContextMenuPosition'

import { LV95 } from '@swissgeo/coordinates'

const props = defineProps<{
    coordinate: [number, number] | null
    projection?: CoordinateSystem
}>()

const { rows, isLoading, clipboards } = useContextMenuPosition(
    computed(() => props.coordinate),
    computed(() => props.projection ?? LV95)
)

const resolveLink = (row: Row): string | undefined => {
    if (typeof row.labelLink === 'function') {
        return row.labelLink(row.value)
    }
    return row.labelLink
}

const resolvedLinks = computed(() => rows.value.map((row) => resolveLink(row)))
</script>

<template>
    <div class="divide-y divide-gray-100">
        <div
            v-if="isLoading"
            class="flex flex-col gap-2 px-4 py-3"
        >
            <div
                v-for="i in 6"
                :key="i"
                class="flex items-center justify-between gap-4"
            >
                <USkeleton class="h-4 w-30 rounded" />
                <USkeleton class="h-4 flex-1 rounded" />
                <USkeleton class="size-7 rounded" />
            </div>
        </div>
        <div
            v-else
            v-for="(row, index) in rows"
            :key="row.label"
            class="flex items-center justify-between gap-4 px-4 py-2 hover:bg-gray-50"
        >
            <ULink
                v-if="resolvedLinks[index]"
                :to="resolvedLinks[index]"
                target="_blank"
                rel="noopener noreferrer"
                class="min-w-30"
            >
                {{ row.label }}
            </ULink>
            <span
                v-else
                class="min-w-30"
            >
                {{ row.label }}
            </span>
            <span class="flex-1 text-sm whitespace-pre-line text-gray-700">
                {{ row.value }}
            </span>
            <UButton
                :icon="clipboards[index]?.copied ? 'i-lucide-check' : 'i-lucide-copy'"
                :class="clipboards[index]?.copied ? 'text-green-500' : ''"
                color="neutral"
                variant="ghost"
                square
                size="sm"
                @click="clipboards[index]?.copy(row.value)"
            />
        </div>
    </div>
</template>
