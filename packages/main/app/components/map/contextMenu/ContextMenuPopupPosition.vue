<script setup lang="ts">
import type { CoordinateSystem } from '@swissgeo/coordinates'

import { LV95 } from '@swissgeo/coordinates'

const props = defineProps<{
    coordinate: [number, number] | null
    projection?: CoordinateSystem
}>()

const { rows, isLoading } = useContextMenuPosition(
    computed(() => props.coordinate),
    computed(() => props.projection ?? LV95)
)
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
        <MapContextMenuRow
            v-else
            v-for="row in rows"
            :key="row.label"
            :label="row.label"
            :label-link="row.labelLink"
            :value="row.value"
        />
    </div>
</template>
