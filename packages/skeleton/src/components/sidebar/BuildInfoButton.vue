<script lang="ts" setup>
import IconButton from '@/components/IconButton.vue'

const config = useRuntimeConfig()

const gitCommit = config.public.gitCommit
const buildTime = config.public.buildTime
</script>

<template>
    <UPopover
        mode="hover"
        :content="{ side: 'right' }"
    >
        <IconButton
            severity="neutral"
            :text="true"
            square
            aria-label="Build information"
            iconName="info"
        />

        <template #content>
            <div class="px-3 py-2 text-xs leading-relaxed whitespace-nowrap">
                <div><span class="font-semibold">Commit:</span> {{ gitCommit }}</div>
                <div><span class="font-semibold">Built:</span> {{ buildTime }}</div>
            </div>
        </template>
    </UPopover>
</template>
