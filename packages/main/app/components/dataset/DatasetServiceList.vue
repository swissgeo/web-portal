<script lang="ts" setup>
import type { Distribution } from '@swissgeo/ogc'

defineProps<{
    distributions: Distribution[]
}>()

const protocolLabels: Record<string, string> = {
    'OGC:WMS': 'WMS',
    'OGC:WMTS': 'WMTS',
    'OGC:STAC': 'STAC',
}

function getServiceLink(distribution: Distribution): string | null {
    return distribution.links?.find((l) => l.rel === 'service')?.href ?? null
}

function getProtocolLabel(distribution: Distribution): string {
    const protocol = distribution.properties.protocol ?? ''
    return protocolLabels[protocol] ?? protocol
}
</script>

<template>
    <ul class="flex flex-col gap-2">
        <li
            v-for="dist in distributions"
            :key="dist.id"
        >
            <ULink
                v-if="getServiceLink(dist)"
                :to="getServiceLink(dist)!"
                target="_blank"
                raw
                class="flex items-center gap-2"
            >
                <UIcon
                    name="i-lucide-server"
                    class="size-3 shrink-0"
                />
                <span class="font-medium">{{ getProtocolLabel(dist) }}</span>
                <span v-if="dist.properties.title">— {{ dist.properties.title }}</span>
            </ULink>
            <span
                v-else
                class="flex items-center gap-2 text-sm"
            >
                <UIcon
                    name="i-lucide-server"
                    class="size-3 shrink-0"
                />
                <span class="font-medium">{{ getProtocolLabel(dist) }}</span>
            </span>
        </li>
    </ul>
</template>
