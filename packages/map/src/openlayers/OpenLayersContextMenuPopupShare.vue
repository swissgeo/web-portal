<script setup lang="ts">
import { useClipboard } from '../composables/useClipboard.composable'

const SHARE_URL = 'https://map.geo.admin.ch/?...'

const { copy, copied } = useClipboard()
</script>

<template>
    <div class="flex items-center justify-between gap-4 px-4 py-3">
        <span class="text-sm text-gray-700">
            {{ SHARE_URL }}
        </span>
        <UButton
            :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
            :class="copied ? 'text-green-500' : ''"
            color="neutral"
            variant="ghost"
            square
            size="sm"
            @click="copy(SHARE_URL)"
        />
    </div>
</template>
