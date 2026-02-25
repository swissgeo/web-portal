<script lang="ts" setup>
import LucideIcon from '@/components/LucideIcon.vue'

const config = useRuntimeConfig()

const gitCommit = config.public.gitCommit
const buildTime = config.public.buildTime
</script>

<template>
    <UPopover
        mode="hover"
        :content="{ side: 'right' }"
    >
        <UButton
            color="neutral"
            variant="ghost"
            square
            aria-label="Build information"
        >
            <template #leading>
                <LucideIcon
                    name="Info"
                    class="w-5 text-cyan-900 opacity-50"
                />
            </template>
        </UButton>

        <template #content>
            <div class="px-3 py-2 text-xs leading-relaxed whitespace-nowrap">
                <div><span class="font-semibold">Commit:</span> {{ gitCommit }}</div>
                <div><span class="font-semibold">Built:</span> {{ buildTime }}</div>
            </div>
        </template>
    </UPopover>
</template>
