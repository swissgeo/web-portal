<script setup lang="ts">
import { Copy } from 'lucide-vue-next'

defineProps<{
    coordinate: [number, number] | null
}>()
</script>

<template>
    <div class="flex items-center justify-between gap-4 px-4 py-3">
        <span class="text-sm text-gray-700">
            <!-- Share URL or embed code will go here -->
            https://map.geo.admin.ch/?...
        </span>
        <button class="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
            <Copy :size="14" />
        </button>
    </div>
</template>
