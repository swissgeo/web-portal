<script lang="ts" setup>
import { IconButton } from '@swissgeo/skeleton'

const { t } = useI18n()

const items = computed(() => [
    {
        label: t('debug.share'),
        icon: 'i-lucide-share',
        slot: 'share',
    },
    {
        label: t('debug.stateConfig'),
        icon: 'i-lucide-save',
        slot: 'stateconfig',
    },
])
</script>

<template>
    <div class="flex gap-2 bg-white shadow">
        <UTabs :items="items">
            <template #share>
                <DebugShare></DebugShare>
            </template>
            <template #stateconfig>
                <DebugStateConfigPanel class="relative overflow-hidden" />
            </template>
            <template #list-trailing>
                <IconButton
                    class="ml-2"
                    @click="$emit('close')"
                    severity="primary"
                    iconName="X"
                    title="Close"
                />
            </template>
        </UTabs>
    </div>
</template>
